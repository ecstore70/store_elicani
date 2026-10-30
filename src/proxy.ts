/**
 * Proxy do Elicani (Next.js 16 — substitui o middleware.ts, deprecado).
 *
 * Responsabilidades da Fase 1:
 *  1. Encaminhar {slug}.{NEXT_PUBLIC_STORE_DOMAIN}/ → /store/[slug]
 *     (arquitetura de wildcard pronta para o storefront público);
 *  1b. Responder 404 real para loja inativa/inexistente (ver nota no ramo 2);
 *  2. Redirecionar www → domínio principal;
 *  3. Renovar a sessão Supabase (refresh dos cookies);
 *  4. Proteger rotas /app e redirecionar usuário logado fora de /login.
 *
 * Defesa em profundidade: páginas e server actions também validam a
 * sessão por conta própria — o proxy não é a única barreira.
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/env";
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

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname, search } = request.nextUrl;
  const host = request.headers.get("host") ?? "";
  const domain = getStoreDomain();
  const hostname = host.split(":")[0].toLowerCase();

  // ── 1. www → domínio principal ─────────────────────────────────────────
  if (hostname === `www.${domain}`) {
    const url = request.nextUrl.clone();
    url.hostname = domain;
    return NextResponse.redirect(url);
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
