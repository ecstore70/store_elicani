/**
 * Proxy do Elicani (Next.js 16 — substitui o middleware.ts, deprecado).
 *
 * Responsabilidades da Fase 1:
 *  0. Redirecionar valorfacil.elicani.site → valorfacil.blogspot.com
 *     (blog externo no Blogger; 301 permanente preservando caminho e query);
 *  0b. Manter /terms, /privacy, /faq e /stores no host de MARKETING
 *      (conteúdo institucional; alinhado à metadataBase, à canônica e ao
 *      sitemap);
 *  0c. Forma canônica da loja: {qualquer host da família}/store/{slug}/…
 *      → {slug}.{domain}/… (301 permanente — o apex duplicava o conteúdo
 *      do subdomínio; rel=canonical fica como segunda rede de segurança);
 *  1. Encaminhar {slug}.{NEXT_PUBLIC_STORE_DOMAIN}/ → /store/[slug]
 *     (arquitetura de wildcard pronta para o storefront público);
 *  1b. Distinguir loja INEXISTENTE (404 real) de loja INATIVA: a inativa
 *     recebe o estado indisponível da vitrine (200 + noindex, ver ramo 2) —
 *     nunca 404, nunca página quebrada;
 *  1c. Responder 404 real em /store/{slug}/products/{id-ou-slug} quando a
 *     loja não existe ou o produto não pertence a ela (param malformado,
 *     URL cruzada); 301 da forma antiga (UUID) para a forma canônica
 *     (slug); loja inativa → a página de produto renderiza o estado
 *     indisponível;
 *  1d. Responder 404 real em /store/{slug}/terms|privacy|faq quando a loja
 *     não existe ou o documento não está publicado (o rodapé só mostra
 *     links com conteúdo); loja inativa → estado indisponível;
 *  1e. Responder 404 real em /store/{slug}/categories/{id-ou-slug} quando a
 *     loja não existe, a categoria não existe/pertence a outra loja ou está
 *     INATIVA (desativada some da vitrine); 301 da forma UUID para a slug;
 *     loja inativa → estado indisponível;
 *  1f. Responder 404 real em /store/{slug}/order/{uuid} quando a loja não
 *     existe ou a encomenda não existe/pertence a outra loja (capability
 *     URL do comprador — nunca vazar estado de tenant); loja inativa →
 *     estado indisponível;
 *  2. Redirecionar www → domínio principal;
 *  2b. Manter páginas de auth (/login, /signup, …) no host canônico —
 *      evita o split dos cookies PKCE entre alias e host do app;
 *  2c. Manter /terms, /privacy, /faq, /stores no host de MARKETING
 *      (conteúdo institucional; alinhado à metadataBase, à canônica e ao
 *      sitemap);
 *  3. Renovar a sessão Supabase (refresh dos cookies);
 *  4. Proteger rotas /app e redirecionar usuário logado fora de /login.
 *
 * Defesa em profundidade: páginas e server actions também validam a
 * sessão por conta própria — o proxy não é a única barreira.
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";
import { getMarketingUrl, getSiteUrl, getSupabaseAnonKey, getSupabaseUrl } from "@/lib/env";
import { isSafeInternalPath } from "@/lib/safe-redirect";
import { extractStoreSlug, getStoreDomain } from "@/lib/stores/resolve";
import {
  isPlatformOwnerSlugException,
  isReservedSlug,
  validateSlugFormat,
} from "@/lib/stores/slug";

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

/** Documento público de uma loja — segmento depois de /store/{slug}/. */
type PolicyDoc = "terms" | "privacy" | "faq";

/**
 * Há conteúdo PUBLICADO do documento da loja? Devolve:
 *  - `true`  → existe texto/itens: a página renderiza normalmente;
 *  - `false` → loja ativa SEM conteúdo → 404 real (o rodapé só liga
 *    links com conteúdo, então esta URL nunca tem tráfego legítimo);
 *  - `null`  → não deu para verificar (falha em aberto) → a página
 *    revalida e decide por conta própria (nunca derrubar a vitrine).
 *
 * Só é chamada com status "active" — loja inativa nunca chega aqui (a
 * página dela é o estado indisponível: 200 + noindex).
 */
async function isPolicyPublished(
  slug: string,
  doc: PolicyDoc,
): Promise<boolean | null> {
  try {
    const publicClient = createServerClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
      // O proxy não tem cookies a manipular nesta consulta.
      cookies: { getAll: () => [], setAll: () => {} },
    });

    if (doc === "faq") {
      const { data: store, error: storeError } = await publicClient
        .from("stores")
        .select("id")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();
      if (storeError) return null;
      if (!store) return null; // corrida (desativada entre consultas)

      const { count, error } = await publicClient
        .from("store_faq_items")
        .select("id", { count: "exact", head: true })
        .eq("store_id", store.id);
      if (error) return null;
      return (count ?? 0) > 0;
    }

    const { data, error } = await publicClient
      .from("stores")
      .select("terms, privacy_policy")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();
    if (error) return null;
    if (!data) return null; // corrida → a página revalida
    const value = doc === "terms" ? data.terms : data.privacy_policy;
    return Boolean(value && value.trim().length > 0);
  } catch {
    return null; // falha em aberto
  }
}

/** Formato de uuid — ids malformados não geram query nem 400 do PostgREST. */
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Resolve o produto na loja ATIVA por SLUG ou UUID (URL pública aceita
 * os dois segmentos — ver src/lib/catalog/product-slug.ts).
 *
 * `found: false` (→ 404 real) para produto inexistente ou pertencente a
 * OUTRA loja (URL cruzada); falha em aberto em erro de rede/DB
 * (`found: true, slug: null` — a página revalida e NADA é redirecionado
 * no escuro).
 *
 * `slug` devolvido habilita o 301 da forma antiga (UUID) para a forma
 * canônica (slug) — chamador em proxy().
 */
type ProductLookup = { found: boolean; slug: string | null };

async function lookupStoreProduct(
  storeSlug: string,
  productParam: string,
): Promise<ProductLookup> {
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
    if (storeError) return { found: true, slug: null }; // falha em aberto
    if (!store) return { found: false, slug: null };

    // UUID → tenta por id primeiro; slug → por slug. Format coincidente
    // (slug com cara de uuid): id vence, slug é o fallback.
    if (UUID_PATTERN.test(productParam)) {
      const { data: byId, error: idError } = await publicClient
        .from("products")
        .select("id, slug")
        .eq("id", productParam)
        .eq("store_id", store.id)
        .maybeSingle();
      if (idError) return { found: true, slug: null };
      if (byId) return { found: true, slug: byId.slug };
    }

    const { data: bySlug, error: slugError } = await publicClient
      .from("products")
      .select("id, slug")
      .eq("slug", productParam)
      .eq("store_id", store.id)
      .maybeSingle();
    if (slugError) return { found: true, slug: null };
    if (bySlug) return { found: true, slug: bySlug.slug };
    return { found: false, slug: null };
  } catch {
    return { found: true, slug: null }; // falha em aberto
  }
}

/**
 * Resolve a categoria na loja ATIVA por SLUG ou UUID (mesma convenção de
 * produto — ver src/lib/catalog/category-slug.ts).
 *
 * `found: false` (→ 404 real) para categoria inexistente, pertencente a
 * OUTRA loja (URL cruzada) ou INATIVA (desativada some da vitrine — o
 * mesmo contrato dos documentos não publicados); falha em aberto em erro
 * de rede/DB (`found: true, slug: null` — a página revalida e NADA é
 * redirecionado no escuro).
 *
 * `slug` devolvido habilita o 301 da forma antiga (UUID) para a forma
 * canônica (slug) — chamador em proxy().
 */
type CategoryLookup = { found: boolean; slug: string | null };

async function lookupStoreCategory(
  storeSlug: string,
  categoryParam: string,
): Promise<CategoryLookup> {
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
    if (storeError) return { found: true, slug: null }; // falha em aberto
    if (!store) return { found: false, slug: null };

    // UUID → tenta por id primeiro; slug → por slug (id vence em empate).
    // `is_active` explícito: categoria desativada sai da vitrine → 404.
    if (UUID_PATTERN.test(categoryParam)) {
      const { data: byId, error: idError } = await publicClient
        .from("categories")
        .select("id, slug")
        .eq("id", categoryParam)
        .eq("store_id", store.id)
        .eq("is_active", true)
        .maybeSingle();
      if (idError) return { found: true, slug: null };
      if (byId) return { found: true, slug: byId.slug };
    }

    const { data: bySlug, error: slugError } = await publicClient
      .from("categories")
      .select("id, slug")
      .eq("slug", categoryParam)
      .eq("store_id", store.id)
      .eq("is_active", true)
      .maybeSingle();
    if (slugError) return { found: true, slug: null };
    if (bySlug) return { found: true, slug: bySlug.slug };
    return { found: false, slug: null };
  } catch {
    return { found: true, slug: null }; // falha em aberto
  }
}

/**
 * A encomenda existe para ESTA loja? (página de seguimento do comprador)
 *
 * Usa a MESMA função pública da página (`order_public_status`, SECURITY
 * DEFINER, sem PII). `found: false` (→ 404 real) para uuid malformado
 * (nem query) ou encomenda inexistente/pertencente a OUTRA loja (URL
 * cruzada — nunca vazar estado de tenant); falha em aberto em erro de
 * rede/DB (`found: true` — a página revalida e decide por conta própria).
 */
async function lookupOrderPublic(
  storeSlug: string,
  orderId: string,
): Promise<{ found: boolean }> {
  if (!UUID_PATTERN.test(orderId)) return { found: false };
  try {
    const publicClient = createServerClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
      cookies: { getAll: () => [], setAll: () => {} },
    });
    const { data, error } = await publicClient.rpc("order_public_status", {
      p_store_slug: storeSlug,
      p_order_id: orderId,
    });
    if (error) return { found: true }; // falha em aberto
    return { found: data !== null };
  } catch {
    return { found: true }; // falha em aberto
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

  // ── 0. páginas de auth no host canônico (getSiteUrl) ───────────────────
  //
  // Os cookies PKCE do login Google são HOST-ONLY: a ação de login grava o
  // code verifier no host onde a página foi servida, mas o /auth/callback
  // roda sempre no host canônico (redirect_to = getSiteUrl()). Quando os
  // dois hosts divergem (ex.: elicani.site × app.elicani.site), o callback
  // lê outro jar de cookies → "code challenge does not match previously
  // saved code verifier" e o login Google falha. Redirecionar /login,
  // /signup, /forgot-password e /reset-password para o host canônico
  // garante ação → Google → callback no MESMO host.
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

  // ── 0b. documentos + diretório da plataforma só no host de MARKETING ───
  //
  // /terms, /privacy, /faq e /stores são conteúdo institucional da
  // Elicani: o rodapé da landing liga /terms (host de marketing) e a
  // metadataBase, as canônicas e o sitemap usam getMarketingUrl — o
  // redirect tem de apontar para ESSE host, senão a canônica (marketing)
  // redireciona para si própria via host do app (cadeia circular) e cada
  // clique do rodapé pula de domínio. Servidos sob um subdomínio de LOJA
  // misturariam identidades (conteúdo institucional com cara de loja) —
  // qualquer host ≠ marketing recebe 307 para o host de marketing.
  // As demais rotas (landing, /app, vitrine) não são afetadas.
  const marketingHost = new URL(getMarketingUrl()).hostname;
  const isPlatformDocPath =
    pathname === "/terms" ||
    pathname === "/privacy" ||
    pathname === "/faq" ||
    pathname === "/stores";
  if (isPlatformDocPath && hostname !== marketingHost) {
    const url = request.nextUrl.clone();
    url.hostname = marketingHost;
    return NextResponse.redirect(url);
  }

  // ── 0c. forma canônica da loja: {host da família}/store/{slug}/… → … ───
  //
  // A identidade preferida do comerciante é o SUBDOMÍNIO (canonical, OG e
  // sitemap usam storePublicUrl). O apex e os demais hosts da família
  // (www, app, subdomínio de OUTRA loja) servem hoje o MESMO conteúdo em
  // /store/{slug}/… — duplicata. Consolidamos com 301 permanente para
  // {slug}.{domain} preservando caminho e query (rel=canonical fica como
  // segunda rede de segurança, como pedido).
  //
  // Sem loop: no destino extractStoreSlug(host) === slug → a regra não
  // dispara. Slugs que não podem virar subdomínio (reservados/inválidos)
  // caem nos ramos de status existentes (404 real). Hosts FORA da família
  // (localhost, previews do Vercel) não entram na regra — o dev local e os
  // ambientes de preview servem como sempre.
  const storePathMatch = /^\/store\/([^/]+)(\/.*)?$/.exec(pathname);
  if (storePathMatch && domain !== "localhost") {
    const pathSlug = storePathMatch[1];
    const inStoreFamily =
      hostname === domain ||
      hostname === marketingHost ||
      hostname.endsWith(`.${domain}`);
    const slugCanBeSubdomain =
      validateSlugFormat(pathSlug) === null &&
      (!isReservedSlug(pathSlug) || isPlatformOwnerSlugException(pathSlug));
    if (
      inStoreFamily &&
      slugCanBeSubdomain &&
      extractStoreSlug(hostname, domain) !== pathSlug
    ) {
      const url = request.nextUrl.clone();
      url.hostname = `${pathSlug}.${domain}`;
      return NextResponse.redirect(url, 301);
    }
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
    if (status === "active") {
      const lookup = await lookupStoreProduct(productPath[1], productPath[2]);
      if (!lookup.found) {
        const rewrite = NextResponse.rewrite(new URL("/_not-found", request.url));
        return new NextResponse(rewrite.body, { status: 404, headers: rewrite.headers });
      }
      // 301 da forma ANTIGA (UUID) para a forma canônica (slug), no MESMO
      // host — o proxy só reescreve a raiz do subdomínio, então o redirect
      // fica no path; a canônica/OG/sitemap continuam apontando para o
      // subdomínio como sempre. Slug atual já passa direto (sem loop).
      if (lookup.slug && UUID_PATTERN.test(productPath[2])) {
        const url = request.nextUrl.clone();
        url.pathname = `/store/${productPath[1]}/products/${lookup.slug}`;
        return NextResponse.redirect(url, 301);
      }
    }
  }

  // ── 1d. documentos da loja: /store/{slug}/terms|privacy|faq ─────────────
  //
  // Mesma armadilha dos ramos 1c/2: sob cacheComponents/PPR o notFound()
  // da página cai no hole dinâmico com status 200 (soft-404). O check
  // cobre loja INEXISTENTE e documento NÃO publicado (ambos → 404 real;
  // o rodapé só liga quando há conteúdo, então não há tráfego legítimo
  // para essas URLs). Loja INATIVA não é 404: a página renderiza o estado
  // indisponível (200 + noindex). Falha em aberto → a página revalida.
  const policyPath = /^\/store\/([^/]+)\/(terms|privacy|faq)\/?$/.exec(pathname);
  if (policyPath) {
    const status = await getStoreStatus(policyPath[1]);
    if (status === "missing") {
      const rewrite = NextResponse.rewrite(new URL("/_not-found", request.url));
      return new NextResponse(rewrite.body, { status: 404, headers: rewrite.headers });
    }
    if (status === "active") {
      const published = await isPolicyPublished(
        policyPath[1],
        policyPath[2] as PolicyDoc,
      );
      if (published === false) {
        const rewrite = NextResponse.rewrite(new URL("/_not-found", request.url));
        return new NextResponse(rewrite.body, { status: 404, headers: rewrite.headers });
      }
    }
  }

  // ── 1e. categorias: /store/{slug}/categories/{id-ou-slug} ──────────────
  //
  // Mesma armadilha dos ramos 1c/1d (soft-404 sob cacheComponents/PPR):
  // sem este check, um notFound() da página de categoria cairia no hole
  // dinâmico com status 200. O check cobre: loja INEXISTENTE (404 real),
  // categoria INEXISTENTE ou de OUTRA loja (URL cruzada — nunca vazar
  // dado de tenant) e categoria INATIVA (desativada some da vitrine, o
  // mesmo contrato dos documentos não publicados). Loja INATIVA não é
  // 404: a página renderiza o estado indisponível (200 + noindex).
  // 301 da forma antiga (UUID) para a forma canônica (slug). Falha em
  // aberto → a página revalida (nada é redirecionado no escuro).
  const categoryPath = /^\/store\/([^/]+)\/categories\/([^/]+)\/?$/.exec(pathname);
  if (categoryPath) {
    const status = await getStoreStatus(categoryPath[1]);
    if (status === "missing") {
      const rewrite = NextResponse.rewrite(new URL("/_not-found", request.url));
      return new NextResponse(rewrite.body, { status: 404, headers: rewrite.headers });
    }
    if (status === "active") {
      const lookup = await lookupStoreCategory(categoryPath[1], categoryPath[2]);
      if (!lookup.found) {
        const rewrite = NextResponse.rewrite(new URL("/_not-found", request.url));
        return new NextResponse(rewrite.body, { status: 404, headers: rewrite.headers });
      }
      // 301 da forma ANTIGA (UUID) para a forma canônica (slug), no MESMO
      // host (espelho do ramo 1c). Slug atual já passa direto (sem loop).
      if (lookup.slug && UUID_PATTERN.test(categoryPath[2])) {
        const url = request.nextUrl.clone();
        url.pathname = `/store/${categoryPath[1]}/categories/${lookup.slug}`;
        return NextResponse.redirect(url, 301);
      }
    }
  }

  // ── 1f. estado da encomenda: /store/{slug}/order/{uuid} ────────────────
  //
  // Mesma armadilha dos ramos 1c/1d/1e (soft-404 sob cacheComponents/PPR):
  // sem este check, o notFound() da página de seguimento cairia no hole
  // dinâmico com status 200. O check cobre: loja INEXISTENTE (404 real),
  // uuid malformado (sem query) e encomenda INEXISTENTE ou de OUTRA loja
  // (URL cruzada — nunca vazar estado de tenant). Loja INATIVA não é
  // 404: a página renderiza o estado indisponível (200 + noindex). Falha
  // em aberto → a página revalida (nada é redirecionado no escuro).
  const orderPath = /^\/store\/([^/]+)\/order\/([^/]+)\/?$/.exec(pathname);
  if (orderPath) {
    const status = await getStoreStatus(orderPath[1]);
    if (status === "missing") {
      const rewrite = NextResponse.rewrite(new URL("/_not-found", request.url));
      return new NextResponse(rewrite.body, { status: 404, headers: rewrite.headers });
    }
    if (status === "active") {
      const lookup = await lookupOrderPublic(orderPath[1], orderPath[2]);
      if (!lookup.found) {
        const rewrite = NextResponse.rewrite(new URL("/_not-found", request.url));
        return new NextResponse(rewrite.body, { status: 404, headers: rewrite.headers });
      }
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
