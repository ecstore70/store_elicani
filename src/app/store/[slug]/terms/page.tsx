import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogUnavailable } from "@/components/storefront/catalog-unavailable";
import { StoreShell } from "@/components/storefront/store-shell";
import { StorePolicyDocument } from "@/components/storefront/store-policy-document";
import { normalizeLocale } from "@/lib/i18n/config";
import { getLocaleChoice, getTranslator } from "@/lib/i18n/locale";
import { createTranslator } from "@/lib/i18n/translate";
import { normalizeAppearance } from "@/lib/stores/appearance";
import { buildStoreSubpageMetadata } from "@/lib/stores/metadata";
import {
  getPublicStoreBySlug,
  getPublicStoreStatus,
} from "@/lib/stores/queries";
import { TEMPLATE_CLASSES, resolveTheme } from "@/lib/storefront/theme";
import { buildStorefrontStrings } from "@/lib/storefront/strings";

type Props = { params: Promise<{ slug: string }> };

/** Resolve a loja no Supabase a cada requisição — rota dinâmica por natureza. */
export const instant = false;

/**
 * Termos de uso da LOJA — conteúdo editável do comerciante
 * (`stores.terms`), parte da identidade da loja no subdomínio próprio.
 *
 * NUNCA misturar com /terms (documento da plataforma, host canônico):
 * este vive sob /store/{slug}/terms e o título/canonical/OG são da
 * loja. Sem conteúdo publicado → 404 real (o link no rodapé só existe
 * quando há conteúdo — nunca link partido nem página em branco).
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const store = await getPublicStoreBySlug(slug);

  if (!store) {
    const t = await getTranslator();
    // Mesmo tratamento da home da loja: inativa → estado indisponível
    // (200 + noindex); inexistente → título de 404. Título ABSOLUTO em
    // ambos — identidade da loja, nunca o template "%s · Elicani".
    if ((await getPublicStoreStatus(slug)) === "inactive") {
      return {
        title: { absolute: t("storefront.catalogUnavailable") },
        robots: { index: false, follow: false },
      };
    }
    return { title: { absolute: t("storefront.notFound") } };
  }

  const visitorChoice = await getLocaleChoice();
  const locale = visitorChoice ?? normalizeLocale(store.language);
  const t = createTranslator(locale);

  return buildStoreSubpageMetadata(
    store,
    `${store.name} — ${t("legal.terms")}`,
    "terms",
  );
}

export default async function StoreTermsPage({ params }: Props) {
  const { slug } = await params;
  const store = await getPublicStoreBySlug(slug);

  if (!store) {
    if ((await getPublicStoreStatus(slug)) === "inactive") {
      return <CatalogUnavailable />;
    }
    notFound();
  }

  // Documento não configurado → 404 (o rodapé esconde o link).
  if (!store.terms) {
    notFound();
  }

  // Preferência explícita do visitante > idioma configurado da loja.
  const visitorChoice = await getLocaleChoice();
  const locale = visitorChoice ?? normalizeLocale(store.language);
  const t = createTranslator(locale);
  const strings = buildStorefrontStrings(t);

  const appearance = normalizeAppearance(store);
  const theme = resolveTheme(appearance);
  const headingClass = TEMPLATE_CLASSES[theme.template].heading;

  return (
    <StoreShell
      store={store}
      locale={locale}
      languageLabel={t("locale.changeLanguage")}
      strings={strings}
      theme={theme}
    >
      <StorePolicyDocument
        title={`${store.name} — ${t("legal.terms")}`}
        headingClass={headingClass}
        backLabel={strings.backToStore}
        storeSlug={store.slug}
      >
        {/* Texto puro do comerciante — preservado tal como escrito
            (whitespace-pre-wrap), sem HTML: render seguro por
            construção, sem editor rich-text no produto. */}
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--sf-muted)]">
          {store.terms}
        </p>
      </StorePolicyDocument>
    </StoreShell>
  );
}
