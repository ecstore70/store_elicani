import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildProductMetadata,
  buildStoreMetadata,
  PLATFORM_ICONS,
  PLATFORM_OG_IMAGE,
  productCanonicalUrl,
  resolveProductOgImages,
  resolveStoreIconUrl,
  resolveStoreIcons,
  resolveStoreOgImages,
  storeCanonicalUrl,
  truncateMetaDescription,
  withAssetVersion,
  type StoreIdentity,
} from "./metadata.ts";

/**
 * Hierarquia de identidade Elicani → catálogo/loja → produto.
 *
 * Estes testes fixam as REGRAS da arquitetura de metadata:
 *  • o favicon do nível loja é favicon_url → logo_url → "herda a plataforma"
 *    (undefined, nunca uma URL de plataforma escrita pelo nível da loja);
 *  • o og:image de cada nível cai pela cadeia do próprio nível e nunca fica
 *    vazio (último degrau: og:image da plataforma);
 *  • canonical = subdomínio, idêntico ao sitemap;
 *  • títulos: loja absoluta (sem template "%s · Elicani"), produto "P · Loja";
 *  • um catálogo nunca herda assets de outro (dois tenants isolados).
 *
 * O domínio de teste é o default de resolve.ts ("elicani.site").
 */
const DOMAIN = "elicani.site";
const VERSION = "2026-11-07T10:00:00.000Z";

function makeStore(overrides: Partial<StoreIdentity> = {}): StoreIdentity {
  return {
    name: "Loja Um",
    slug: "loja-um",
    description: null,
    logo_url: null,
    favicon_url: null,
    banner_url: null,
    updated_at: VERSION,
    ...overrides,
  };
}

/** Normaliza `openGraph.images`/`twitter.images` (união objeto|array) para URLs. */
function imageUrls(images: unknown): string[] {
  if (!images) return [];
  const list = Array.isArray(images) ? images : [images];
  return list.map((image) =>
    typeof image === "string" || image instanceof URL
      ? String(image)
      : String((image as { url: string | URL }).url),
  );
}

describe("truncateMetaDescription", () => {
  it("valor curto passa tal e qual (trimmed)", () => {
    assert.equal(truncateMetaDescription("  Roupas bonitas  ", "fb"), "Roupas bonitas");
  });

  it("nulo/vazio cai para o fallback do nível", () => {
    assert.equal(truncateMetaDescription(null, "Loja on Elicani"), "Loja on Elicani");
    assert.equal(truncateMetaDescription("   ", "fb"), "fb");
  });

  it("até 160 caracteres não é cortado", () => {
    const text = "x".repeat(160);
    assert.equal(truncateMetaDescription(text, "fb"), text);
  });

  it("texto longo corta em fronteira de palavra com reticências", () => {
    const word = "palavra ".repeat(60); // > 160
    const result = truncateMetaDescription(word, "fb");
    assert.ok(result.length <= 160, `comprimento ${result.length}`);
    assert.ok(result.endsWith("…"));
    assert.ok(!result.includes("  "));
    assert.equal(result[result.length - 2], "a"); // termina numa palavra inteira
  });

  it("sem espaços corta duro e nunca excede 160", () => {
    const result = truncateMetaDescription("y".repeat(300), "fb");
    assert.equal(result.length, 160);
  });
});

describe("withAssetVersion", () => {
  it("anexa ?v= quando não há query", () => {
    assert.equal(withAssetVersion("https://cdn/x.png", VERSION), `https://cdn/x.png?v=${encodeURIComponent(VERSION)}`);
  });

  it("anexa &v= quando já há query", () => {
    assert.equal(
      withAssetVersion("https://cdn/x.png?w=10", VERSION),
      `https://cdn/x.png?w=10&v=${encodeURIComponent(VERSION)}`,
    );
  });
});

describe("favicon do catálogo (cadeia de fallback)", () => {
  it("favicon_url vence logo_url", () => {
    const url = resolveStoreIconUrl(
      makeStore({ favicon_url: "https://cdn/fav.png", logo_url: "https://cdn/logo.png" }),
    );
    assert.equal(url, `https://cdn/fav.png?v=${encodeURIComponent(VERSION)}`);
  });

  it("sem favicon usa o logo (branding do comerciante)", () => {
    const url = resolveStoreIconUrl(makeStore({ logo_url: "https://cdn/logo.png" }));
    assert.equal(url, `https://cdn/logo.png?v=${encodeURIComponent(VERSION)}`);
  });

  it("sem nenhum → null (herda os ícones da plataforma no root layout)", () => {
    assert.equal(resolveStoreIconUrl(makeStore()), null);
  });

  it("resolveStoreIcons: com branding devolve SÓ a URL do comerciante", () => {
    const icons = resolveStoreIcons(makeStore({ favicon_url: "https://cdn/fav.svg" }));
    assert.ok(icons);
    const serialized = JSON.stringify(icons);
    // icon + apple apontam ambos para o favicon do comerciante…
    assert.equal(serialized.match(/cdn\/fav\.svg\?/g)?.length, 2);
    // …e NUNCA misturam assets da plataforma na mesma página.
    assert.ok(!serialized.includes("/brand/"));
    assert.ok(!serialized.includes("/favicon.ico"));
  });

  it("resolveStoreIcons: sem branding → undefined (herança do pai, sem declaração própria)", () => {
    assert.equal(resolveStoreIcons(makeStore()), undefined);
  });
});

describe("og:image por nível", () => {
  it("loja: capa (banner) vence logo, versionada, alt = nome da loja", () => {
    const images = resolveStoreOgImages(
      makeStore({ banner_url: "https://cdn/cover.jpg", logo_url: "https://cdn/logo.png" }),
    );
    assert.equal(images.length, 1);
    assert.equal(images[0].url, `https://cdn/cover.jpg?v=${encodeURIComponent(VERSION)}`);
    assert.equal(images[0].alt, "Loja Um");
  });

  it("loja: sem capa usa o logo; sem nenhum cai no OG da plataforma", () => {
    assert.equal(
      resolveStoreOgImages(makeStore({ logo_url: "https://cdn/logo.png" }))[0].url,
      `https://cdn/logo.png?v=${encodeURIComponent(VERSION)}`,
    );
    const fallback = resolveStoreOgImages(makeStore());
    assert.equal(fallback[0].url, PLATFORM_OG_IMAGE);
    assert.equal(fallback[0].alt, "Elicani");
  });

  it("produto: imagem primária do produto vence tudo (sem versionar)", () => {
    const images = resolveProductOgImages(
      makeStore({ banner_url: "https://cdn/cover.jpg" }),
      { id: "p1", name: "Vestido", description: null, image_url: "https://cdn/p1.jpg" },
    );
    assert.equal(images[0].url, "https://cdn/p1.jpg");
    assert.equal(images[0].alt, "Vestido");
  });

  it("produto: sem imagem cai para a identidade da loja e depois plataforma", () => {
    const store = makeStore({ banner_url: "https://cdn/cover.jpg" });
    assert.equal(
      resolveProductOgImages(store, { id: "p1", name: "Vestido", description: null, image_url: null })[0].url,
      `https://cdn/cover.jpg?v=${encodeURIComponent(VERSION)}`,
    );
    assert.equal(
      resolveProductOgImages(makeStore(), { id: "p1", name: "V", description: null, image_url: null })[0].url,
      PLATFORM_OG_IMAGE,
    );
  });
});

describe("buildStoreMetadata — nível catálogo/loja", () => {
  const branded = makeStore({
    name: "Café Aurora",
    slug: "cafe-aurora",
    description: "Café de especialidade".repeat(30),
    favicon_url: "https://cdn/aurora-fav.ico",
    banner_url: "https://cdn/aurora-cover.jpg",
  });

  it("título absoluto (sem template '%s · Elicani') e siteName = loja", () => {
    const meta = buildStoreMetadata(branded);
    assert.deepEqual(meta.title, { absolute: "Café Aurora" });
    assert.equal(meta.openGraph?.siteName, "Café Aurora");
    assert.equal(meta.openGraph?.title, "Café Aurora");
  });

  it("canonical = subdomínio (forma do sitemap)", () => {
    const meta = buildStoreMetadata(branded);
    assert.equal(meta.alternates?.canonical, `https://cafe-aurora.${DOMAIN}`);
    assert.equal(meta.openGraph?.url, `https://cafe-aurora.${DOMAIN}`);
    assert.equal(storeCanonicalUrl("cafe-aurora"), `https://cafe-aurora.${DOMAIN}`);
  });

  it("description truncada a 160 com reticências", () => {
    const meta = buildStoreMetadata(branded);
    assert.ok((meta.description ?? "").length <= 160);
    assert.ok((meta.description ?? "").endsWith("…"));
  });

  it("sem descrição → fallback do nível", () => {
    const meta = buildStoreMetadata(makeStore({ name: "Flor" }));
    assert.equal(meta.description, "Flor on Elicani");
  });

  it("com branding: icons SÓ do comerciante; og/twitter com a capa", () => {
    const meta = buildStoreMetadata(branded);
    assert.ok(meta.icons);
    assert.match(JSON.stringify(meta.icons), /aurora-fav\.ico\?/);
    assert.ok(!JSON.stringify(meta.icons).includes("/brand/"));
    assert.equal(imageUrls(meta.openGraph?.images)[0], `https://cdn/aurora-cover.jpg?v=${encodeURIComponent(VERSION)}`);
    assert.equal((meta.twitter as { card?: string } | undefined)?.card, "summary_large_image");
    assert.equal(meta.twitter?.title, "Café Aurora");
  });

  it("sem branding: SEM chave icons (herda a plataforma) e OG = plataforma", () => {
    const meta = buildStoreMetadata(makeStore());
    assert.equal("icons" in meta, false);
    assert.equal(imageUrls(meta.openGraph?.images)[0], PLATFORM_OG_IMAGE);
    assert.ok(JSON.stringify(PLATFORM_ICONS).includes("/favicon.ico"));
  });

  it("noindex NÃO é responsabilidade do resolver (estado ativo indexa por omissão)", () => {
    const meta = buildStoreMetadata(makeStore());
    assert.equal(meta.robots, undefined);
  });
});

describe("buildProductMetadata — nível produto", () => {
  const store = makeStore({
    name: "Café Aurora",
    slug: "cafe-aurora",
    logo_url: "https://cdn/aurora-logo.png",
  });
  const product = {
    id: "7c50cd8e-adac-48a4-bfa7-d395d53f1106",
    name: "Grãos Torrados",
    description: "Torra média",
    image_url: "https://cdn/graos.jpg",
  };

  it("título = 'Produto · Loja' (produto + contexto do comerciante)", () => {
    const meta = buildProductMetadata(store, product);
    assert.deepEqual(meta.title, { absolute: "Grãos Torrados · Café Aurora" });
    assert.equal(meta.openGraph?.siteName, "Café Aurora");
  });

  it("canonical do produto no subdomínio da loja (forma do sitemap)", () => {
    const meta = buildProductMetadata(store, product);
    const expected = `https://cafe-aurora.${DOMAIN}/store/cafe-aurora/products/${product.id}`;
    assert.equal(meta.alternates?.canonical, expected);
    assert.equal(productCanonicalUrl("cafe-aurora", product.id), expected);
  });

  it("og:image = imagem primária do produto; twitter espelha", () => {
    const meta = buildProductMetadata(store, product);
    assert.equal(imageUrls(meta.openGraph?.images)[0], "https://cdn/graos.jpg");
    assert.equal(imageUrls(meta.twitter?.images)[0], "https://cdn/graos.jpg");
    assert.equal(meta.twitter?.title, "Grãos Torrados · Café Aurora");
  });

  it("favicon do produto = identidade da loja dona (nunca a plataforma nem outra)", () => {
    const meta = buildProductMetadata(store, product);
    assert.match(JSON.stringify(meta.icons), /aurora-logo\.png\?/);
    const other = buildProductMetadata(
      makeStore({ name: "Loja Dois", slug: "loja-dois", favicon_url: "https://other/fav.png" }),
      product,
    );
    assert.ok(!JSON.stringify(other.icons).includes("aurora-logo"));
    assert.ok(!JSON.stringify(meta.icons).includes("other/fav.png"));
  });
});

describe("isolamento entre catálogos (dois tenants)", () => {
  const a = makeStore({
    name: "Café Aurora",
    slug: "cafe-aurora",
    favicon_url: "https://cdn-a/fav.png",
    logo_url: "https://cdn-a/logo.png",
    banner_url: "https://cdn-a/cover.jpg",
  });
  const b = makeStore({
    name: "Ateliê Costura",
    slug: "atelie-costura",
    favicon_url: "https://cdn-b/fav.png",
    logo_url: "https://cdn-b/logo.png",
    banner_url: "https://cdn-b/cover.jpg",
    updated_at: "2026-11-07T11:00:00.000Z",
  });

  it("metadados de A não contêm NENHUM asset/URL de B (e vice-versa)", () => {
    const metaA = JSON.stringify(buildStoreMetadata(a));
    const metaB = JSON.stringify(buildStoreMetadata(b));
    assert.ok(!metaA.includes("cdn-b") && !metaA.includes("atelie-costura"));
    assert.ok(!metaB.includes("cdn-a") && !metaB.includes("cafe-aurora"));
  });

  it("canônicas distintas por catálogo", () => {
    assert.notEqual(storeCanonicalUrl(a.slug), storeCanonicalUrl(b.slug));
    const prodA = JSON.stringify(buildProductMetadata(a, { id: "p", name: "P", description: null, image_url: null }));
    const prodB = JSON.stringify(buildProductMetadata(b, { id: "p", name: "P", description: null, image_url: null }));
    assert.ok(prodA.includes("cafe-aurora") && !prodA.includes("atelie-costura"));
    assert.ok(prodB.includes("atelie-costura") && !prodB.includes("cafe-aurora"));
  });

  it("versões de cache distintas → URLs distintas (nenhum cache cruzado)", () => {
    assert.notEqual(
      resolveStoreIconUrl(a),
      resolveStoreIconUrl({ ...a, updated_at: b.updated_at }),
    );
  });
});
