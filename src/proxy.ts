/**
 * Proxy do Elicani (Next.js 16 — substitui o middleware.ts, deprecado).
 *
 * Responsabilidades da Fase 1:
 *  0. Redirecionar valorfacil.elicani.site → valorfacil.blogspot.com
 *     (blog externo no Blogger; 301 permanente preservando caminho e query);
 *  1. Encaminhar {slug}.{NEXT_PUBLIC_STORE_DOMAIN}/ → /store/[slug]
 *     (arquitetura de wildcard pronta para o storefront público);
 *  1b. Distinguir loja INEXISTENTE (404 real) de loja INATIVA: a inativa
 *     recebe o estado indisponível da vitrine (200 + noindex, ver ramo 2) —
 *     nunca 404, nunca página quebrada;
 *  1c. Responder 404 real em /store/{slug}/products/{id} quando a loja não
 *     existe ou o produto não pertence a ela (id malformado, URL cruzada);
 *     loja inativa → a página de produto renderiza o estado indisponível;
 *  2. Redirecionar www → domínio principal;
 *  2b. Manter páginas de auth (/login, /signup, …) no host canônico —
 *      evita o split dos cookies PKCE entre alias e host do app;
 *  3. Renovar a sessão Supabase (refresh dos cookies);
 *  4. Proteger rotas /app e redirecionar usuário logado fora de /login.
 *
 * Defesa em profundidade: páginas e server actions também validam a
 * sessão por conta própria — o proxy não é a única barreira.
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";
import { getSiteUrl, getSupabaseAnonKey, getSupabaseUrl } from "@/lib/env";
import { isSafeInternalPath } from "@/lib/safe-redirect";
import { extractStoreSlug, getStoreDomain } from "@/lib/stores/resolve";

/**
 * Consulta pública (chave anon) que responde o STATUS do catálogo de um slug:
 * 'active' | 'inactive' | 'missing'.
 *
 * Usa a função `store_public_status` (SECURITY DEFINER) porque o RLS esconde
 * lojas INATIVAS do papel anon — consultando a tabela diretamente, inativa e
 * inexistente seriam indistinguíveis. A função devolve só o estado.
 *
 * Falha em aberto → "active": a página revalida e decide por conta própria
 * (nunca derrubar a vitrine por erro transiente).
 */
async function getStoreStatus(
  slug: string,
): Promise<"active" | "inactive" | "missing"> {
  try {
    const publicClient = createServerClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
      // O proxy não tem cookies a manipular nesta consulta.
      cookies: { getAll: () => [], setAll: () => {} },
    });
    const { data, error } = await publicClient.rpc("store_public_status", {
      p_slug: slug,
    });
    if (error) return "active"; // falha em aberto: a página revalida
    if (data === "inactive") return "inactive";
    if (data === "active") return "active";
    return "missing";
  } catch {
    return "active"; // falha em aberto: a página revalida
  }
}

/** Formato de uuid — ids malformados não geram query nem 400 do PostgREST. */
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Consulta pública que responde se o produto EXISTE nesta loja ATIVA.
 * Devolve `false` (→ 404 real) para loja inativa/inexistente, id malformado
 * ou produto pertencente a outra loja; falha em aberto em erro de rede/DB.
 */
async function isStoreProduct(
  storeSlug: string,
  productId: string,
): Promise<boolean> {
  if (!UUID_PATTERN.test(productId)) return false;
  try {
    const publicClient = createServerClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
      cookies: { getAll: () => [], setAll: () => {} },
    });
    const { data: store, error: storeError } = await publicClient
      .from("stores")
      .select("id")
      .eq("slug", storeSlug)
      .eq("is_active", true)
      .maybeSingle();
    if (storeError) return true; // falha em aberto: a página revalida
    if (!store) return false;

    const { data: product, error: productError } = await publicClient
      .from("products")
      .select("id")
      .eq("id", productId)
      .eq("store_id", store.id)
      .maybeSingle();
    if (productError) return true; // falha em aberto: a página revalida
    return Boolean(product);
  } catch {
    return true; // falha em aberto: a página revalida
  }
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname, search } = request.nextUrl;
  const host = request.headers.get("host") ?? "";
  const domain = getStoreDomain();
  const hostname = host.split(":")[0].toLowerCase();

  // ── 00. blog externo: valorfacil.elicani.site → blogspot ────────────────
  //
  // Domínio de blog hospedado no Blogger (fora do Elicani). Redireciona
  // QUALQUER caminho/query (ex.: /?m=1) para o blog correspondente com 301
  // permanente. Vem antes de todas as regras para nenhum redirecionamento
  // interno (auth canônica, www) capturar este host.
  if (hostname === "valorfacil.elicani.site") {
    return NextResponse.redirect(
      `https://valorfacil.blogspot.com${pathname}${search}`,
      301,
    );
  }

  // ── 0. páginas de auth só no host canônico (getSiteUrl) ─────────────────
  //
  // Os cookies PKCE do login Google são HOST-ONLY: a ação de login grava o
  // code verifier no host onde a página foi servida, mas o /auth/callback
  // roda sempre no host canônico (redirect_to = getSiteUrl()). Quando os
  // dois hosts divergem (ex.: elicani.site × app.elicani.site), o callback
  // lê outro jar de cookies → "code challenge does not match previously
  // saved code verifier" e o login Google falha. Redirecionar /login,
  // /signup, /forgot-password e /reset-password para o host canônico
  // garante ação → Google → callback no MESMO host. As demais rotas
  // (landing, /app, vitrine) não são afetadas.
  const canonicalHost = new URL(getSiteUrl()).hostname;
  const isAuthOnlyPath =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password";
  if (isAuthOnlyPath && hostname !== canonicalHost) {
    const url = request.nextUrl.clone();
    url.hostname = canonicalHost;
    return NextResponse.redirect(url);
  }

  // ── 1. www → domínio principal ─────────────────────────────────────────
  if (hostname === `www.${domain}`) {
    const url = request.nextUrl.clone();
    url.hostname = domain;
    return NextResponse.redirect(url);
  }

  // ── 1c. página de produto: só existe para catálogo público ─────────────
  //
  // Mesma justificativa do ramo 2: sob cacheComponents/PPR o notFound()
  // da página cai no hole dinâmico com status 200 (soft-404). O check cobre:
  // loja INEXISTENTE (404 real), id malformado (uuid inválido → sem query),
  // produto que não pertence a ESTA loja (URL cruzada) e falha em aberto
  // (erro de rede/DB deixa a página revalidar como antes).
  //
  // Loja INATIVA não é 404: a URL passa e a página de produto renderiza o
  // estado indisponível do catálogo (200 + noindex).
  const productPath = /^\/store\/([^/]+)\/products\/([^/]+)\/?$/.exec(pathname);
  if (productPath) {
    const status = await getStoreStatus(productPath[1]);
    if (status === "missing") {
      const rewrite = NextResponse.rewrite(new URL("/_not-found", request.url));
      return new NextResponse(rewrite.body, { status: 404, headers: rewrite.headers });
    }
    if (
      status === "active" &&
      !(await isStoreProduct(productPath[1], productPath[2]))
    ) {
      const rewrite = NextResponse.rewrite(new URL("/_not-found", request.url));
      return new NextResponse(rewrite.body, { status: 404, headers: rewrite.headers });
    }
  }

  // ── 2. storefront: {slug}.{domain}/ → /store/{slug} ───────────────────
  //
  // Loja INEXISTENTE recebe 404 REAL aqui, antes do render: com
  // cacheComponents/PPR o Next envia o shell estático com status 200 e o
  // notFound() da página cai dentro do hole dinâmico — o cliente veria o
  // conteúdo 404 com status 200 (soft-404), ruim para o SEO das lojas.
  //
  // Loja INATIVA nunca é 404: passa adiante e a página /store/[slug]
  // renderiza o estado indisponível do catálogo (200 + robots noindex) —
  // sem dados do comerciante (o RLS já escondeu a linha) e sem erro
  // técnico. O check é falho em aberto: erro de rede/DB não derruba a
  // vitrine, pois a página continua validando a loja por conta própria.
  const storeSlug = extractStoreSlug(host, domain);
  const pathMatch = /^\/store\/([^/]+)\/?$/.exec(pathname);
  const storefrontSlug = storeSlug && pathname === "/" ? storeSlug : (pathMatch?.[1] ?? null);

  if (storefrontSlug) {
    const status = await getStoreStatus(storefrontSlug);
    if (status === "missing") {
      // Rewrite para a rota interna de not-found (conteúdo 404 branded com
      // noindex) mantendo status HTTP 404 real na resposta do proxy.
      const rewrite = NextResponse.rewrite(new URL("/_not-found", request.url));
      return new NextResponse(rewrite.body, { status: 404, headers: rewrite.headers });
    }
    if (storeSlug && pathname === "/") {
      return NextResponse.rewrite(
        new URL(`/store/${encodeURIComponent(storefrontSlug)}`, request.url),
      );
    }
  }

  // ── 3. refresh da sessão Supabase ─────────────────────────────────────
  const response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isProtectedRoute = pathname === "/app" || pathname.startsWith("/app/");
  const isAuthPage =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/forgot-password";

  // ── 4a. área logada exige sessão ──────────────────────────────────────
  if (isProtectedRoute && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  // ── 4b. já logado não precisa ver login/signup/forgot-password ────────
  if (isAuthPage && user) {
    const next = request.nextUrl.searchParams.get("next");
    const url = request.nextUrl.clone();
    url.pathname = isSafeInternalPath(next) ? next : "/app";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Exclui assets estáticos — eles servem direto, sem passar pelo proxy.
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml).*)",
  ],
};
