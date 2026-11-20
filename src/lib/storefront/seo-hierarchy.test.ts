import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

/**
 * Contrato da hierarquia de indexação
 * `plataforma → /stores → loja → categoria → produto` — lê as fontes (o
 * runner não parseia JSX) e trava:
 *
 *  • rota de categoria: server-rendered, tenant-scoped, canonical própria,
 *    breadcrumb loja → categoria, h1 = categoria, CTA de WhatsApp NEUTRO;
 *  • chips de categoria como links reais (aprimoramento progressivo) com
 *    fallback de botão no preview;
 *  • breadcrumb do produto estendido (loja → [categoria] → produto) sem
 *    mexer em Product/Offer/seller/CTA;
 *  • h1 da home da loja (prop `storeNameAsHeading`, MESMA classe) — só a
 *    home o passa;
 *  • sitemap com `/stores` + categorias pelos builders canônicos, sem
 *    fórmulas inline e sem URLs privadas;
 *  • proxy: 301 apex→subdomínio sem loop, guard de categoria com 404
 *    real, `/stores` fixo no host de marketing;
 *  • noindex: /app (defesa em profundidade) + checkout intacto;
 *  • robots.txt inalterado (Allow-all, sem Disallow).
 */

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROJECT = path.resolve(HERE, "../../..");

const read = (relative: string) =>
  readFileSync(path.join(PROJECT, relative), "utf8");

/** Código sem comentários — os scans anti-mau-cheiro olham só ao código. */
function codeOnly(source: string): string {
  return source
    .split("\n")
    .filter((line) => !/^\s*(\/\/|\*|\/\*)/.test(line))
    .join("\n");
}

const CATEGORY_PAGE = "src/app/store/[slug]/categories/[categorySlug]/page.tsx";
const PRODUCT_PAGE = "src/app/store/[slug]/products/[productId]/page.tsx";
const STORE_PAGE = "src/app/store/[slug]/page.tsx";
const CHECKOUT_PAGE = "src/app/store/[slug]/checkout/page.tsx";
const SHELL = "src/components/storefront/store-shell.tsx";
const CATALOG = "src/components/storefront/storefront-catalog.tsx";
const SITEMAP = "src/app/sitemap.ts";
const ROBOTS = "src/app/robots.ts";
const APP_LAYOUT = "src/app/app/layout.tsx";
const PROXY = "src/proxy.ts";

describe("rota de categoria (server-rendered, tenant-scoped)", () => {
  const src = read(CATEGORY_PAGE);
  const code = codeOnly(src);

  it("server component: sem \"use client\", rota dinâmica (instant=false)", () => {
    assert.ok(!src.includes('"use client"'));
    assert.match(src, /export const instant = false;/);
  });

  it("metadata própria via buildCategoryMetadata; 404 real, sem página falsa", () => {
    assert.match(src, /buildCategoryMetadata\(/);
    assert.match(src, /notFound\(\)/);
    // loja inativa → estado indisponível com noindex (nunca 404)
    assert.match(src, /robots: \{ index: false, follow: false \}/);
    // título de 404 absoluto — nunca o template "%s · Elicani"
    assert.match(src, /title: \{ absolute: t\("storefront\.notFound"\) \}/);
  });

  it("categoria só da PRÓPRIA loja e ATIVA (catálogo por store_id)", () => {
    assert.match(src, /getPublicCatalog\(store\.id\)/);
    assert.match(src, /catalog\.categories\.find/);
    assert.match(src, /item\.category_id === category\.id/);
  });

  it("CTA de WhatsApp NEUTRO nesta rota (sem whatsappProduct — 4933dc3 intacto)", () => {
    assert.ok(!code.includes("whatsappProduct"));
  });

  it("breadcrumb visível loja → categoria + exatamente um JSON-LD", () => {
    assert.match(code, /strings\.backToStore/);
    assert.match(code, /aria-current="page"/);
    assert.equal((src.match(/<JsonLd/g) ?? []).length, 1, "um único JsonLd");
    assert.match(code, /BreadcrumbList/);
  });

  it("h1 único = nome da categoria", () => {
    assert.match(code, /<h1 /);
    assert.match(code, /\{category\.name\}/);
    assert.equal((code.match(/<h1 /g) ?? []).length, 1, "um único h1 na rota");
  });

  it("catálogo com links reais: storeSlug + categoria ativa", () => {
    assert.match(code, /storeSlug=\{store\.slug\}/);
    assert.match(code, /activeCategoryId=\{category\.id\}/);
    assert.match(code, /<StorefrontCatalog/);
  });
});

describe("chips de categoria como links reais (StorefrontCatalog)", () => {
  const src = read(CATALOG);
  const code = codeOnly(src);

  it("modo link na vitrine real (/store/{slug}/categories/{id-ou-slug})", () => {
    assert.match(code, /categoryIndexHref/);
    assert.match(code, /categorySlugOrId\(category\)/);
    assert.match(code, /href=\{`\$\{categoryIndexHref\}\/categories\//);
    assert.match(code, /href=\{categoryIndexHref\}/, "chip All → raiz da loja");
    assert.match(code, /aria-current=\{active \? "page" : undefined\}/);
  });

  it("fallback client-side preservado (preview/landing sem slug)", () => {
    assert.match(code, /setFilterCategoryId/);
    assert.match(code, /!readOnly && setFilterCategoryId/);
    assert.match(code, /aria-pressed=\{active\}/, "botões mantêm aria-pressed");
  });

  it("busca + fórmula de produto intactas (productSlugOrId)", () => {
    assert.match(code, /productSlugOrId\(product\)/);
    assert.match(code, /normalizedQuery/);
  });
});

describe("página de produto — breadcrumb loja → categoria → produto", () => {
  const src = read(PRODUCT_PAGE);
  const code = codeOnly(src);

  it("categoria condicional no JSON-LD (position 3 só quando existe)", () => {
    assert.match(src, /categoryCanonicalUrl\(/);
    assert.match(src, /categorySlugOrId\(category\)/);
    assert.match(src, /position: categoryUrl \? 3 : 2/);
    assert.match(src, /\.\.\.\(categoryUrl && category/);
  });

  it("categoria condicional no breadcrumb visível (link real da irmã)", () => {
    assert.match(code, /\/categories\/\$\{categorySlugOrId\(category\)\}/);
  });

  it("Product/Offer/seller @id + canonical intactos (regressão)", () => {
    assert.match(src, /"@type": "Product"/);
    assert.match(src, /"@type": "Offer"/);
    assert.match(src, /seller/);
    assert.match(src, /productCanonicalUrl\(/);
    assert.match(src, /buildProductMetadata\(/);
  });

  it("CTA/painel/share intactos (4933dc3 + a0a44a4)", () => {
    assert.match(src, /whatsappProduct=\{\{/);
    assert.match(src, /<ProductPurchase/);
    assert.match(src, /<ProductShare/);
  });

  it("sem storeNameAsHeading (h1 do produto segue o único da página)", () => {
    assert.ok(!src.includes("storeNameAsHeading"));
  });
});

describe("h1 da home da loja (design-preserving)", () => {
  const shell = read(SHELL);
  const storePage = read(STORE_PAGE);
  const productPage = read(PRODUCT_PAGE);
  const categoryPage = read(CATEGORY_PAGE);

  it("prop storeNameAsHeading com MESMA classe do <p> original", () => {
    assert.match(shell, /storeNameAsHeading/);
    assert.ok(
      shell.includes('<h1 className="truncate text-base font-semibold">'),
      "h1 herda exatamente as classes do p (preflight = visual idêntico)",
    );
    assert.ok(
      shell.includes('<p className="truncate text-base font-semibold">'),
      "p permanece para as demais rotas",
    );
  });

  it("exatamente 2 <h1 className= no fonte (checkout + home condicional)", () => {
    assert.equal((shell.match(/<h1 className=/g) ?? []).length, 2);
  });

  it("só a home da loja passa a prop", () => {
    assert.match(storePage, /storeNameAsHeading/);
    assert.ok(!productPage.includes("storeNameAsHeading"));
    assert.ok(!categoryPage.includes("storeNameAsHeading"));
  });
});

describe("sitemap — builders canônicos, /stores e categorias", () => {
  const src = read(SITEMAP);
  const code = codeOnly(src);

  it("todas as URLs pelos builders de stores/metadata (fonte única)", () => {
    assert.match(src, /storeCanonicalUrl\(/);
    assert.match(src, /storeSubpageCanonicalUrl\(/);
    assert.match(src, /productCanonicalUrl\(/);
    assert.match(src, /categoryCanonicalUrl\(/);
    // fórmulas inline eliminadas:
    assert.ok(!src.includes("storePublicUrl("), "helper inline removido");
    assert.ok(!src.includes("/products/${"), "montagem manual de produto removida");
  });

  it("inclui /stores (ponte plataforma → lojas) + categorias ativas do banco", () => {
    assert.match(src, /`\$\{marketingUrl\}\/stores`/);
    assert.match(src, /\.from\("categories"\)/);
    assert.match(src, /\.select\("id, store_id, slug, updated_at"\)/);
    assert.match(src, /\.eq\("is_active", true\)/);
    assert.match(src, /category\.slug \?\? category\.id/, "UUID só como fallback");
  });

  it("nunca URLs privadas (auth/painel/checkout) — só código olhado", () => {
    assert.ok(!code.includes("/app"));
    assert.ok(!code.includes("/login"));
    assert.ok(!code.includes("/signup"));
    assert.ok(!code.includes("checkout"));
  });

  it("fallback de falha preservado (home sempre no sitemap)", () => {
    assert.match(src, /catch \{/);
    assert.match(src, /mantém ao menos a home no sitemap/);
  });
});

describe("proxy — canônica de host + guard de categoria", () => {
  const src = read(PROXY);

  it("0c: apex/family → subdomínio 301, preservando path, sem loop", () => {
    const branch = src.slice(
      src.indexOf("0c. forma canônica"),
      src.indexOf("── 1. www"),
    );
    assert.ok(branch.includes("url.hostname = `${pathSlug}.${domain}`"));
    assert.ok(branch.includes("NextResponse.redirect(url, 301)"));
    assert.ok(
      branch.includes("extractStoreSlug(hostname, domain) !== pathSlug"),
      "guard anti-loop",
    );
    assert.ok(branch.includes('domain !== "localhost"'), "dev local intacto");
    assert.ok(branch.includes("inStoreFamily"), "só hosts da família");
    assert.ok(branch.includes("request.nextUrl.clone()"), "path+query preservados");
  });

  it("1e: categoria inexistente/cruzada/inativa → 404 real; UUID → 301 slug", () => {
    const guard = src.slice(
      src.indexOf("1e. categorias"),
      src.indexOf("── 2. storefront"),
    );
    assert.ok(guard.includes('status === "missing"'));
    assert.ok(guard.includes("lookupStoreCategory("));
    assert.ok(guard.includes("NextResponse.rewrite"));
    assert.ok(guard.includes("NextResponse.redirect(url, 301)"));
    assert.ok(guard.includes("/categories/${lookup.slug}"));
    assert.ok(
      guard.includes('UUID_PATTERN.test(categoryPath[2])'),
      "301 só da forma antiga (sem loop)",
    );
  });

  it("lookup de categoria: própria loja + ativa; falha em aberto", () => {
    const start = src.indexOf("async function lookupStoreCategory");
    assert.ok(start >= 0);
    const fn = src.slice(start, src.indexOf("\nexport ", start + 10));
    assert.ok(fn.includes('from("categories")'));
    assert.ok(fn.includes('.eq("store_id", store.id)'));
    assert.ok(fn.includes('.eq("is_active", true)'));
    assert.ok(fn.includes("found: true, slug: null"), "fail-open documentado");
  });

  it("0b: /stores fixo no host de marketing (não vira cara de loja)", () => {
    assert.ok(src.includes('pathname === "/stores"'));
    const docs = src.slice(
      src.indexOf("0b. documentos + diretório"),
      src.indexOf("0c. forma canônica"),
    );
    assert.ok(docs.includes('pathname === "/terms"'));
    assert.ok(docs.includes("NextResponse.redirect(url)"));
  });
});

describe("noindex / robots", () => {
  it("/app: index:false + follow:false (defesa em profundidade)", () => {
    const app = read(APP_LAYOUT);
    assert.match(app, /robots: \{ index: false, follow: false \}/);
  });

  it("checkout continua noindex (nada mudou)", () => {
    const checkout = read(CHECKOUT_PAGE);
    assert.match(checkout, /robots: \{ index: false, follow: false \}/);
  });

  it("robots.txt inalterado: Allow / , sem Disallow, com sitemap", () => {
    const robots = read(ROBOTS);
    const code = codeOnly(robots);
    assert.match(code, /allow: "\/"/);
    assert.match(code, /sitemap:/);
    assert.ok(!code.toLowerCase().includes("disallow"));
  });
});
