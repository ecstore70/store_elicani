import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogUnavailable } from "@/components/storefront/catalog-unavailable";
import { JsonLd } from "@/components/shared/json-ld";
import { StoreShell } from "@/components/storefront/store-shell";
import { StorePolicyDocument } from "@/components/storefront/store-policy-document";
import { buildFaqJsonLd } from "@/lib/faq-jsonld";
import { normalizeLocale } from "@/lib/i18n/config";
import { getLocaleChoice, getTranslator } from "@/lib/i18n/locale";
import { createTranslator } from "@/lib/i18n/translate";
import { normalizeAppearance } from "@/lib/stores/appearance";
import { buildStoreSubpageMetadata } from "@/lib/stores/metadata";
import {
  getPublicStoreBySlug,
  getPublicStoreFaq,
  getPublicStoreStatus,
} from "@/lib/stores/queries";
import { TEMPLATE_CLASSES, resolveTheme } from "@/lib/storefront/theme";
import { buildStorefrontStrings } from "@/lib/storefront/strings";

type Props = { params: Promise<{ slug: string }> };

/** Resolve a loja no Supabase a cada requisição — rota dinâmica por natureza. */
export const instant = false;

/**
 * FAQ da LOJA — perguntas/respostas publicadas pelo comerciante
 * (`store_faq_items`), com FAQPage JSON-LD espelhando APENAS o conteúdo
 * visível (mesmo array do render — markup nunca tem itens extras).
 *
 * Sem perguntas publicadas → 404 (o rodapé esconde o link enquanto não
 * há conteúdo). NUNCA misturar com /faq (FAQ da plataforma).
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const store = await getPublicStoreBySlug(slug);

  if (!store) {
    const t = await getTranslator();
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
    `${store.name} — ${t("legal.faqFull")}`,
    "faq",
  );
}

export default async function StoreFaqPage({ params }: Props) {
  const { slug } = await params;
  const store = await getPublicStoreBySlug(slug);

  if (!store) {
    if ((await getPublicStoreStatus(slug)) === "inactive") {
      return <CatalogUnavailable />;
    }
    notFound();
  }

  const items = await getPublicStoreFaq(store.id);

  // Sem perguntas publicadas → 404 (rodapé esconde o link).
  if (items.length === 0) {
    notFound();
  }

  const visitorChoice = await getLocaleChoice();
  const locale = visitorChoice ?? normalizeLocale(store.language);
  const t = createTranslator(locale);
  const strings = buildStorefrontStrings(t);

  const appearance = normalizeAppearance(store);
  const theme = resolveTheme(appearance);
  const headingClass = TEMPLATE_CLASSES[theme.template].heading;

  // JSON-LD nasce do MESMO array renderizado abaixo — se está visível,
  // está no markup; se não há itens, a página nem existe (404 acima).
  const jsonLd = buildFaqJsonLd(items);

  return (
    <StoreShell
      store={store}
      locale={locale}
      languageLabel={t("locale.changeLanguage")}
      strings={strings}
      theme={theme}
    >
      <StorePolicyDocument
        title={`${store.name} — ${t("legal.faqFull")}`}
        headingClass={headingClass}
        backLabel={strings.backToStore}
        storeSlug={store.slug}
      >
        <div>
          {items.map((item) => (
            <section
              key={item.id}
              className="mt-6 first:mt-0"
              aria-labelledby={`faq-${item.id}`}
            >
              <h2
                id={`faq-${item.id}`}
                className="text-base font-semibold leading-snug"
              >
                {item.question}
              </h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--sf-muted)]">
                {item.answer}
              </p>
            </section>
          ))}
        </div>
      </StorePolicyDocument>

      {jsonLd ? <JsonLd data={jsonLd} /> : null}
    </StoreShell>
  );
}
