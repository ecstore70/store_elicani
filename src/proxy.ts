/**
 * Proxy do Elicani (Next.js 16 — substitui o middleware.ts, deprecado).
 *
 * Responsabilidades da Fase 1:
 *  1. Encaminhar {slug}.{NEXT_PUBLIC_STORE_DOMAIN}/ → /store/[slug]
 *     (arquitetura de wildcard pronta para o storefront público);
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
  const storeSlug = extractStoreSlug(host, domain);
  if (storeSlug && pathname === "/") {
    return NextResponse.rewrite(
      new URL(`/store/${encodeURIComponent(storeSlug)}`, request.url),
    );
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
