import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CatalogUnavailable } from "@/components/storefront/catalog-unavailable";
import { StoreShell } from "@/components/storefront/store-shell";
import { StorefrontCatalog } from "@/components/storefront/storefront-catalog";
import { JsonLd } from "@/components/shared/json-ld";
import { categorySlugOrId } from "@/lib/catalog/category-slug";
import { getPublicCatalog } from "@/lib/catalog/queries";
import { normalizeLocale } from "@/lib/i18n/config";
import { getLocaleChoice, getTranslator } from "@/lib/i18n/locale";
import { createTranslator } from "@/lib/i18n/translate";
import { normalizeAppearance } from "@/lib/stores/appearance";
import {
  buildCategoryMetadata,
  categoryCanonicalUrl,
  storeCanonicalUrl,
} from "@/lib/stores/metadata";
import { getPublicStoreBySlug, getPublicStoreStatus } from "@/lib/stores/queries";
import { buildStorefrontStrings } from "@/lib/storefront/strings";
import { resolveTheme, TEMPLATE_CLASSES } from "@/lib/storefront/theme";

type Props = {
  params: Promise<{ slug: string; categorySlug: string }>;
};

/** Resolve loja + categoria no Supabase a cada requisição — sem cache. */
export const instant = false;

/**
 * Carrega loja, categoria e os produtos dela num só ponto (usado pela
 * página E pelas metadados).
 *
 * O segmento público aceita SLUG ou UUID (mesma convenção de produto — o
 * proxy 301 a forma UUID para a slug antes daqui; a página resolve os
 * dois direto). A categoria só existe se pertencer a ESTA loja e estar
 * ATIVA: `getPublicCatalog` é carregado pelo `store_id` da própria loja e
 * já filtra `is_active` — nunca vaza categoria de outro tenant nem de
 * categoria desativada (o proxy reforça com o 404 dele).
 *
 *  • `{ unavailable: true }` — catálogo da loja INATIVO: renderiza o
 *    estado indisponível (200 + noindex), nunca 404;
 *  • `null` — loja inexistente OU categoria não encontrada → 404 real.
 */
async function loadCategory(slug: string, idOrSlug: string) {
  const store = await getPublicStoreBySlug(slug);
  if (!store) {
    return (await getPublicStoreStatus(slug)) === "inactive"
      ? { unavailable: true as const }
      : null;
  }

  const catalog = await getPublicCatalog(store.id);
  const category =
    catalog.categories.find((item) => item.id === idOrSlug) ??
    catalog.categories.find((item) => item.slug === idOrSlug) ??
    null;
  if (!category) return null;

  const products = catalog.products.filter(
    (item) => item.category_id === category.id,
  );
  return { store, catalog, category, products };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, categorySlug } = await params;
  const loaded = await loadCategory(slug, categorySlug);

  if (!loaded) {
    const t = await getTranslator();
    // Loja INEXISTENTE ou categoria INEXISTENTE/inativa → título de 404 do
    // proxy. `absolute` numa URL de LOJA: o template "%s · Elicani" do
    // root nunca aparece (identidade da plataforma não se mistura).
    return { title: { absolute: t("storefront.notFound") } };
  }

  if ("unavailable" in loaded) {
    const t = await getTranslator();
    // Loja INATIVA → estado indisponível (200 + noindex), nunca 404.
    return {
      title: { absolute: t("storefront.catalogUnavailable") },
      robots: { index: false, follow: false },
    };
  }

  // Identidade do nível categoria: título "{Categoria} · {Loja}",
  // canonical e favicon/OG da loja dona — nunca os da plataforma nem de
  // outra loja (ver stores/metadata.ts).
  return buildCategoryMetadata(loaded.store, loaded.category);
}

/**
 * Página de categoria da vitrine — `/store/{slug}/categories/{id-ou-slug}`.
 *
 * A camada de UI é a MESMA da home da loja (`StoreShell` +
 * `StorefrontCatalog`): breadcrumb Loja → Categoria, `<h1>` = nome da
 * categoria e o grid filtrado no servidor com links reais de produto
 * (fórmula `productSlugOrId` intacta). Os chips do catálogo são os
 * links das categorias IRMÃS (navegar sem voltar à home).
 *
 * CTA de WhatsApp NEUTRO aqui (sem `whatsappProduct`): contexto de
 * produto só existe na rota de produto — comportamento do commit
 * 4933dc3 permanece intocado.
 */
export default async function CategoryPage({ params }: Props) {
  const { slug, categorySlug } = await params;
  const loaded = await loadCategory(slug, categorySlug);

  if (!loaded) notFound();
  if ("unavailable" in loaded) return <CatalogUnavailable />;

  const { store, catalog, category, products } = loaded;

  // Preferência explícita do visitante > idioma configurado pela loja.
  const visitorChoice = await getLocaleChoice();
  const locale = visitorChoice ?? normalizeLocale(store.language);
  const t = createTranslator(locale);
  const strings = buildStorefrontStrings(t);

  const appearance = normalizeAppearance(store);
  const theme = resolveTheme(appearance);
  const classes = TEMPLATE_CLASSES[theme.template];

  const storeUrl = storeCanonicalUrl(store.slug);
  const categoryUrl = categoryCanonicalUrl(
    store.slug,
    categorySlugOrId(category),
  );

  return (
    <StoreShell
      store={store}
      locale={locale}
      languageLabel={t("locale.changeLanguage")}
      strings={strings}
      theme={theme}
    >
      {/* BreadcrumbList espelha o breadcrumb VISUAL logo abaixo
          (loja → categoria) — markup = conteúdo visível, mesma URL
          canônica. */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: store.name,
              item: storeUrl,
            },
            {
              "@type": "ListItem",
              position: 2,
              name: category.name,
              item: categoryUrl,
            },
          ],
        }}
      />

      <nav className="mb-5">
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-[var(--sf-muted)]">
          <li>
            <Link
              href={`/store/${store.slug}`}
              className="underline-offset-4 hover:text-[var(--sf-fg)] hover:underline"
            >
              {strings.backToStore}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li
            aria-current="page"
            className="min-w-0 truncate text-[var(--sf-fg)]"
          >
            {category.name}
          </li>
        </ol>
      </nav>

      <h1 className={`mb-5 text-xl leading-tight sm:text-2xl ${classes.heading}`}>
        {category.name}
      </h1>

      <StorefrontCatalog
        products={products}
        categories={catalog.categories}
        activeCategoryId={category.id}
        appearance={{
          template: theme.template,
          product_layout: appearance.product_layout,
          image_ratio: appearance.image_ratio,
        }}
        strings={strings}
        currency={store.currency}
        locale={locale}
        storeSlug={store.slug}
      />
    </StoreShell>
  );
}
