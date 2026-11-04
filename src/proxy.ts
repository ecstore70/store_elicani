/**
 * Proxy do Elicani (Next.js 16 — substitui o middleware.ts, deprecado).
 *
 * Responsabilidades da Fase 1:
 *  1. Encaminhar {slug}.{NEXT_PUBLIC_STORE_DOMAIN}/ → /store/[slug]
 *     (arquitetura de wildcard pronta para o storefront público);
 *  1b. Responder 404 real para loja inativa/inexistente (ver nota no ramo 2);
 *  1c. Responder 404 real também em /store/{slug}/products/{id} (loja
 *     ausente, id malformado ou produto de outra loja) — mesma nota do
 *     ramo 2 vale para a página de produto;
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
 * Consulta pública (chave anon, RLS de leitura) que responde se a loja existe
 * e está ativa. Usada só pelo proxy para decidir o status HTTP — a página da
 * vitrine continua buscando os dados completos por conta própria.
 */
async function isStoreActive(slug: string): Promise<boolean> {
  try {
    const publicClient = createServerClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
      // O proxy não tem cookies a manipular nesta consulta.
      cookies: { getAll: () => [], setAll: () => {} },
    });
    const { data, error } = await publicClient
      .from("stores")
      .select("id")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();
    if (error) return true; // falha em aberto: a página revalida
    return Boolean(data);
  } catch {
    return true; // falha em aberto: a página revalida
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

  // ── 1c. página de produto: {slug}/{id} precisa existir (404 real) ──────
  //
  // Mesma justificativa do ramo 2: sob cacheComponents/PPR o notFound()
  // da página cai no hole dinâmico com status 200 (soft-404). Aqui o check
  // cobre: loja inativa/inexistente, id malformado (uuid inválido → sem
  // query) e produto que não pertence a ESTA loja (URL cruzada). Falha em
  // aberto: erro de rede/DB deixa a página revalidar como antes.
  const productPath = /^\/store\/([^/]+)\/products\/([^/]+)\/?$/.exec(pathname);
  if (productPath && !(await isStoreProduct(productPath[1], productPath[2]))) {
    const rewrite = NextResponse.rewrite(new URL("/_not-found", request.url));
    return new NextResponse(rewrite.body, { status: 404, headers: rewrite.headers });
  }

  // ── 2. storefront: {slug}.{domain}/ → /store/{slug} ───────────────────
  //
  // Loja inativa ou inexistente recebe 404 REAL aqui, antes do render. Com
  // cacheComponents/PPR, o Next envia o shell estático com status 200 e o
  // notFound() da página cai dentro do hole dinâmico — o cliente veria o
  // conteúdo 404 com status 200 (soft-404), ruim para o SEO das lojas.
  // O check é falho em aberto: erro de rede/DB não derruba a vitrine, pois a
  // página continua validando a loja por conta própria.
  const storeSlug = extractStoreSlug(host, domain);
  const pathMatch = /^\/store\/([^/]+)\/?$/.exec(pathname);
  const storefrontSlug = storeSlug && pathname === "/" ? storeSlug : (pathMatch?.[1] ?? null);

  if (storefrontSlug) {
    if (!(await isStoreActive(storefrontSlug))) {
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
