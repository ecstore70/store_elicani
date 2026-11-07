import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogUnavailable } from "@/components/storefront/catalog-unavailable";
import { StoreShell } from "@/components/storefront/store-shell";
import { StorefrontCatalog } from "@/components/storefront/storefront-catalog";
import { normalizeLocale } from "@/lib/i18n/config";
import { getLocaleChoice, getTranslator } from "@/lib/i18n/locale";
import { createTranslator } from "@/lib/i18n/translate";
import { getPublicCatalog } from "@/lib/catalog/queries";
import { normalizeAppearance } from "@/lib/stores/appearance";
import { getPublicStoreBySlug, getPublicStoreStatus } from "@/lib/stores/queries";
import { resolveTheme } from "@/lib/storefront/theme";
import { buildStorefrontStrings } from "@/lib/storefront/strings";

type Props = { params: Promise<{ slug: string }> };

/** Resolve a loja no Supabase a cada requisição — rota dinâmica por natureza. */
export const instant = false;

/**
 * Vitrine pública — estrutura PADRÃO Elicani (`StoreShell`, partilhado com
 * a página de produto), apresentação controlada pelo comerciante (template,
 * cores, layout, imagem, botões e cards).
 *
 * O proxy encaminha {slug}.{NEXT_PUBLIC_STORE_DOMAIN}/ para aqui. A página
 * resolve a loja e o catálogo com a credencial ANON (o RLS só devolve
 * dados de lojas ATIVAS).
 *
 * Camada de UI da vitrine: idioma da escolha EXPLÍCITA do visitante
 * (cookie `elicani_locale`, definido pelo seletor do cabeçalho) quando
 * existe; caso contrário, o idioma configurado pela loja. Conteúdo do
 * comerciante nunca é traduzido automaticamente.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const store = await getPublicStoreBySlug(slug);

  if (!store) {
    const t = await getTranslator();
    // Loja inativa renderiza o estado indisponível (200): título genérico
    // + noindex. Só loja INEXISTENTE cai no título de 404 do proxy.
    if ((await getPublicStoreStatus(slug)) === "inactive") {
      return {
        title: t("storefront.catalogUnavailable"),
        robots: { index: false, follow: false },
      };
    }
    return { title: t("storefront.notFound") };
  }

  return {
    title: store.name,
    description: store.description ?? `${store.name} on Elicani`,
    openGraph: {
      title: store.name,
      description: store.description ?? `${store.name} on Elicani`,
      ...(store.banner_url ? { images: [store.banner_url] } : {}),
    },
  };
}

export default async function StorefrontPage({ params }: Props) {
  const { slug } = await params;
  const store = await getPublicStoreBySlug(slug);

  if (!store) {
    // Loja inativa → estado indisponível profissional (nunca 404 nem erro
    // técnico); loja inexistente → 404 real. Defesa em profundidade do
    // mesmo racional do proxy (aqui cobre falha em aberto do check lá).
    if ((await getPublicStoreStatus(slug)) === "inactive") {
      return <CatalogUnavailable />;
    }
    notFound();
  }

  // Preferência explícita do visitante > idioma configurado pela loja.
  const visitorChoice = await getLocaleChoice();
  const locale = visitorChoice ?? normalizeLocale(store.language);
  const t = createTranslator(locale);
  const strings = buildStorefrontStrings(t);

  const catalog = await getPublicCatalog(store.id);

  const appearance = normalizeAppearance(store);
  const theme = resolveTheme(appearance);

  return (
    <StoreShell
      store={store}
      locale={locale}
      languageLabel={t("locale.changeLanguage")}
      strings={strings}
      theme={theme}
    >
      <StorefrontCatalog
        products={catalog.products}
        categories={catalog.categories}
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
