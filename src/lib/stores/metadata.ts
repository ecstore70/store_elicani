import type { Metadata } from "next";
import type { PublicStore } from "./types";
import { storePublicUrl } from "./resolve.ts";

/**
 * Hierarquia de identidade da plataforma — cada nível tem os SEUS assets e
 * metadados, e nenhum nível sobrescreve o outro:
 *
 *   ELICANI (plataforma)  →  CATÁLOGO/LOJA  →  PRODUTO
 *
 * Fonte única de verdade desta resolução (testada em metadata.test.ts):
 *
 *  • favicon da página   → favicon_url → logo_url → herda os ícones da
 *                          plataforma (root layout). `null` aqui significa
 *                          EXPLICITAMENTE "herdar a plataforma" — nunca
 *                          devolvemos uma URL de plataforma a partir do
 *                          nível da loja (o root layout é quem a declara).
 *  • og:image da loja    → banner_url (capa/thumbnail) → logo_url →
 *                          og:image da plataforma.
 *  • og:image do produto → imagem primária do produto (products.image_url,
 *                          espelho da primeira mídia) → capa/logo da loja →
 *                          og:image da plataforma.
 *  • títulos             → loja = nome da loja (absoluto, sem template
 *                          "%s · Elicani"); produto = "Produto · Loja"
 *                          (produto + contexto do comerciante).
 *  • canonical           → URL de subdomínio preferida, idêntica à do
 *                          sitemap (evita divergência canônico/sitemap).
 *
 * Assets versionados com `?v={updated_at}`: browsers e crawlers cacheiam
 * ícones/OG com agressividade por host — muda o branding, muda a URL.
 *
 * Nada aqui lê banco: o chamador (generateMetadata) já resolveu a loja sob
 * RLS, keyed por slug/id — um catálogo nunca herda assets de outro.
 */

/** OG social da plataforma — último fallback de qualquer nível. */
export const PLATFORM_OG_IMAGE = "/brand/elicani-og.png";

/**
 * Ícones da plataforma, declarados como OBJECTO METADATA no root layout
 * (e não como file-conventions em `src/app/`): o Next injeta file-
 * conventions com prioridade absoluta e as anteponem às do segmento filho —
 * o favicon do comerciante perderia sempre para o da plataforma. Com
 * objetos metadata vale a regra normal de merge dos segmentos (o filho
 * substitui o pai), que é exatamente a hierarquia desejada.
 *
 * `/favicon.ico` vive em `public/` (fora de `src/app/`) para continuar
 * respondendo pedidos diretos de crawlers/clients legados SEM gerar uma
 * declaração automática no <head>.
 */
export const PLATFORM_ICONS: NonNullable<Metadata["icons"]> = {
  icon: [
    { url: "/favicon.ico", type: "image/x-icon", sizes: "any" },
    { url: "/brand/elicani-favicon.svg", type: "image/svg+xml", sizes: "any" },
  ],
  apple: [
    {
      url: "/brand/elicani-apple-icon.png",
      type: "image/png",
      sizes: "180x180",
    },
  ],
};

/** Teto de meta description (SERP) — corte em fronteira de palavra. */
const META_DESCRIPTION_MAX = 160;

/** Loja com os campos de identidade usados na resolução. */
export type StoreIdentity = Pick<
  PublicStore,
  | "name"
  | "slug"
  | "description"
  | "logo_url"
  | "favicon_url"
  | "banner_url"
  | "updated_at"
>;

/** Produto com os campos usados na resolução de metadados. */
export type ProductIdentity = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
};

type IconDescriptor = { url: string; type?: string; sizes?: string };
type OgImage = { url: string; alt: string };

/**
 * Meta description: conteúdo do comerciante truncado ao teto da SERP
 * (palavra inteira quando possível), com fallback explícito do nível.
 */
export function truncateMetaDescription(
  text: string | null | undefined,
  fallback: string,
): string {
  const value = text?.trim();
  if (!value) return fallback;
  if (value.length <= META_DESCRIPTION_MAX) return value;

  const cut = value.slice(0, META_DESCRIPTION_MAX - 1);
  const boundary = cut.lastIndexOf(" ");
  const head = boundary >= META_DESCRIPTION_MAX / 2 ? cut.slice(0, boundary) : cut;
  return `${head.replace(/[\s,.;:–—-]+$/, "")}…`;
}

/**
 * Versiona um URL de asset com o `updated_at` da loja — o mesmo branding
 * trocado gera URL novo e o cache (browser/crawler) não serve o antigo.
 */
export function withAssetVersion(url: string, version: string): string {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}v=${encodeURIComponent(version)}`;
}

/** URL canônica da loja — mesma forma do sitemap (subdomínio preferido). */
export function storeCanonicalUrl(slug: string): string {
  return storePublicUrl(slug);
}

/** URL canônica do produto — `/store/{slug}/products/{id}` no subdomínio. */
export function productCanonicalUrl(slug: string, productId: string): string {
  return `${storePublicUrl(slug)}/store/${slug}/products/${productId}`;
}

/** Tipo MIME deduzido da extensão — só quando é inequívoco. */
function guessImageType(url: string): string | undefined {
  const path = url.split(/[?#]/)[0].toLowerCase();
  if (path.endsWith(".svg")) return "image/svg+xml";
  if (path.endsWith(".ico")) return "image/x-icon";
  if (path.endsWith(".png")) return "image/png";
  if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
  if (path.endsWith(".webp")) return "image/webp";
  return undefined;
}

function iconDescriptor(url: string): IconDescriptor {
  const type = guessImageType(url);
  // SVG/ICO são escaláveis — `sizes="any"` descreve bem ambos.
  const sizes =
    type === "image/svg+xml" || type === "image/x-icon" ? "any" : undefined;
  return { url, ...(type ? { type } : {}), ...(sizes ? { sizes } : {}) };
}

/**
 * Favicon do catálogo: `favicon_url` → `logo_url` → `null`
 * (a página herda os ícones da plataforma no root layout).
 */
export function resolveStoreIconUrl(
  store: Pick<StoreIdentity, "favicon_url" | "logo_url" | "updated_at">,
): string | null {
  const candidate = store.favicon_url?.trim() || store.logo_url?.trim();
  return candidate ? withAssetVersion(candidate, store.updated_at) : null;
}

/** Entrada `icons` para a página da loja — só quando ela tem branding. */
export function resolveStoreIcons(
  store: Pick<StoreIdentity, "favicon_url" | "logo_url" | "updated_at">,
): NonNullable<Metadata["icons"]> | undefined {
  const url = resolveStoreIconUrl(store);
  if (!url) return undefined; // sem branding → herda a plataforma
  const entry = iconDescriptor(url);
  return { icon: [entry], apple: [entry] };
}

/** og:image da loja: capa → logo → OG da plataforma (nunca vazio). */
export function resolveStoreOgImages(store: StoreIdentity): OgImage[] {
  const banner = store.banner_url?.trim();
  const logo = store.logo_url?.trim();
  const merchant = banner || logo;
  if (merchant) {
    return [
      {
        url: withAssetVersion(merchant, store.updated_at),
        alt: store.name,
      },
    ];
  }
  return [{ url: PLATFORM_OG_IMAGE, alt: "Elicani" }];
}

/** og:image do produto: imagem primária → capa/logo da loja → plataforma. */
export function resolveProductOgImages(
  store: StoreIdentity,
  product: ProductIdentity,
): OgImage[] {
  const image = product.image_url?.trim();
  if (image) return [{ url: image, alt: product.name }];

  const banner = store.banner_url?.trim();
  const logo = store.logo_url?.trim();
  const merchant = banner || logo;
  if (merchant) {
    return [
      {
        url: withAssetVersion(merchant, store.updated_at),
        alt: store.name,
      },
    ];
  }
  return [{ url: PLATFORM_OG_IMAGE, alt: "Elicani" }];
}

/**
 * Metadados do nível CATÁLOGO/LOJA. Título absoluto (o template
 * "%s · Elicani" do root é só para páginas da plataforma) e `siteName` =
 * nome da loja — a identidade social é do comerciante.
 */
export function buildStoreMetadata(store: StoreIdentity): Metadata {
  const description = truncateMetaDescription(
    store.description,
    `${store.name} on Elicani`,
  );
  const canonical = storeCanonicalUrl(store.slug);
  const images = resolveStoreOgImages(store);
  const icons = resolveStoreIcons(store);

  return {
    title: { absolute: store.name },
    description,
    alternates: { canonical },
    ...(icons ? { icons } : {}),
    openGraph: {
      type: "website",
      siteName: store.name,
      title: store.name,
      description,
      url: canonical,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: store.name,
      description,
      images: images.map((image) => image.url),
    },
  };
}

/**
 * Metadados do nível PRODUTO. Título "Produto · Loja" (produto + contexto
 * do comerciante, como pedido para resultados de busca) e favicon/ícones
 * resolvidos pela identidade da loja dona do produto — o produto nunca
 * tem asset próprio de favicon.
 */
export function buildProductMetadata(
  store: StoreIdentity,
  product: ProductIdentity,
): Metadata {
  const title = `${product.name} · ${store.name}`;
  const description = truncateMetaDescription(
    product.description,
    `${product.name} — ${store.name}`,
  );
  const canonical = productCanonicalUrl(store.slug, product.id);
  const images = resolveProductOgImages(store, product);
  const icons = resolveStoreIcons(store);

  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    ...(icons ? { icons } : {}),
    openGraph: {
      type: "website",
      siteName: store.name,
      title,
      description,
      url: canonical,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: images.map((image) => image.url),
    },
  };
}
