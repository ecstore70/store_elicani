import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CatalogUnavailable } from "@/components/storefront/catalog-unavailable";
import { CheckoutProvider } from "@/components/storefront/checkout-provider";
import { CheckoutView } from "@/components/storefront/checkout-view";
import { StoreShell } from "@/components/storefront/store-shell";
import { normalizeLocale } from "@/lib/i18n/config";
import { getLocaleChoice, getTranslator } from "@/lib/i18n/locale";
import { createTranslator } from "@/lib/i18n/translate";
import { normalizeAppearance } from "@/lib/stores/appearance";
import { getPublicStoreBySlug, getPublicStoreStatus } from "@/lib/stores/queries";
import { resolveTheme } from "@/lib/storefront/theme";
import { buildStorefrontStrings } from "@/lib/storefront/strings";

type Props = { params: Promise<{ slug: string }> };

/** Resolve a loja no Supabase a cada requisição — rota dinâmica por natureza. */
export const instant = false;

/**
 * Rota do CHECKOUT da vitrine — `/store/{slug}/checkout`.
 *
 * Superfície própria (ecrã-cheio no mobile, duas colunas com resumo fixo
 * no desktop) em vez do antigo checkout dentro do diálogo: o carrinho
 * continua no diálogo, o formulário de encomenda mora aqui.
 *
 * Sem canal de WhatsApp a rota redireciona para a loja (a Fase 1 é por
 * WhatsApp); loja inativa renderiza o estado indisponível (200 + noindex),
 * loja inexistente cai no 404 real — as mesmas regras da home.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const store = await getPublicStoreBySlug(slug);

  if (!store) {
    const t = await getTranslator();
    if ((await getPublicStoreStatus(slug)) === "inactive") {
      return {
        title: t("storefront.catalogUnavailable"),
        robots: { index: false, follow: false },
      };
    }
    return { title: t("storefront.notFound") };
  }

  // Checkout é página de transação: noindex, com o nome da loja no título
  // para o visitante reconhecer a aba.
  const visitorChoice = await getLocaleChoice();
  const locale = visitorChoice ?? normalizeLocale(store.language);
  const t = createTranslator(locale);
  return {
    title: `${t("storefront.checkout")} · ${store.name}`,
    robots: { index: false, follow: false },
  };
}

export default async function CheckoutPage({ params }: Props) {
  const { slug } = await params;
  const store = await getPublicStoreBySlug(slug);

  if (!store) {
    if ((await getPublicStoreStatus(slug)) === "inactive") {
      return <CatalogUnavailable />;
    }
    notFound();
  }

  // Sem canal de WhatsApp não há envio possível (defesa em profundidade:
  // o schema já exige `whatsapp_number` com 7–15 dígitos).
  const whatsappDigits = store.whatsapp_number?.replace(/\D/g, "") ?? "";
  if (whatsappDigits.length < 7) redirect(`/store/${store.slug}`);

  // Preferência explícita do visitante > idioma configurado pela loja.
  const visitorChoice = await getLocaleChoice();
  const locale = visitorChoice ?? normalizeLocale(store.language);
  const t = createTranslator(locale);
  const strings = buildStorefrontStrings(t);

  const appearance = normalizeAppearance(store);
  const theme = resolveTheme(appearance);

  return (
    <StoreShell
      store={store}
      locale={locale}
      languageLabel={t("locale.changeLanguage")}
      strings={strings}
      theme={theme}
      // A barra fixa do CTA ocupa o rodapé — a ação flutuante sairia por
      // cima dela.
      showFloatingAction={false}
    >
      <CheckoutProvider
        storeId={store.id}
        storeName={store.name}
        whatsappNumber={store.whatsapp_number}
        currency={store.currency}
        locale={locale}
        strings={strings}
      >
        <CheckoutView storeSlug={store.slug} strings={strings} />
      </CheckoutProvider>
    </StoreShell>
  );
}
