import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, Camera, Globe, Phone } from "lucide-react";
import { CartProvider } from "@/components/storefront/cart-provider";
import { StorefrontCatalog } from "@/components/storefront/storefront-catalog";
import { Logo } from "@/components/shared/logo";
import { LocaleSelector } from "@/components/shared/locale-selector";
import { WhatsAppIcon } from "@/components/shared/whatsapp-icon";
import { normalizeLocale, getLocaleDirection } from "@/lib/i18n/config";
import { getLocaleChoice, getTranslator } from "@/lib/i18n/locale";
import { createTranslator } from "@/lib/i18n/translate";
import { getPublicCatalog } from "@/lib/catalog/queries";
import { normalizeAppearance } from "@/lib/stores/appearance";
import { getPublicStoreBySlug } from "@/lib/stores/queries";
import { resolveTheme } from "@/lib/storefront/theme";
import { buildStorefrontStrings } from "@/lib/storefront/strings";

type Props = { params: Promise<{ slug: string }> };

/** Resolve a loja no Supabase a cada requisição — rota dinâmica por natureza. */
export const instant = false;

/**
 * Vitrine pública — estrutura PADRÃO Elicani, apresentação controlada
 * pelo comerciante (template, cores, layout, imagem, botões e cards).
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

  const whatsappDigits = store.whatsapp_number?.replace(/\D/g, "") ?? "";
  const whatsappHref = whatsappDigits
    ? `https://wa.me/${whatsappDigits}`
    : null;

  const hasStoreInfo =
    Boolean(whatsappHref) ||
    Boolean(store.opening_hours) ||
    Boolean(store.instagram_url) ||
    Boolean(store.facebook_url);

  return (
    <div
      dir={getLocaleDirection(locale)}
      style={theme.cssVars}
      className="flex min-h-svh flex-col bg-[var(--sf-bg)] text-[var(--sf-fg)]"
    >
      <CartProvider
        storeId={store.id}
        storeName={store.name}
        whatsappNumber={store.whatsapp_number}
        currency={store.currency}
        locale={locale}
        strings={strings}
      >
        {/* capa da loja (identidade do comerciante) */}
        {store.banner_url && (
          <div className="relative h-36 w-full overflow-hidden sm:h-48">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={store.banner_url}
              alt={store.name}
              className="size-full object-cover"
            />
          </div>
        )}

        {/* cabeçalho: logo + nome + descrição + carrinho */}
        <header className="border-b border-[var(--sf-border)]">
          <div className="mx-auto flex w-full max-w-[var(--sf-container)] items-center gap-3 px-4 py-4 sm:px-6">
            {store.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={store.logo_url}
                alt={store.name}
                className="size-10 shrink-0 rounded-[var(--sf-radius)] object-cover"
              />
            ) : null}

            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold">{store.name}</p>
              {store.description && (
                <p className="truncate text-sm text-[var(--sf-muted)]">
                  {store.description}
                </p>
              )}
            </div>

            {/* idioma da UI do visitante — não confundir com o conteúdo da loja */}
            <LocaleSelector
              current={locale}
              label={t("locale.changeLanguage")}
              align="end"
              tone="storefront"
              className="w-40 shrink-0"
            />

            {/* botão do carrinho vive dentro do provider (posicionado fixo) */}
          </div>
        </header>

        <main className="mx-auto w-full max-w-[var(--sf-container)] flex-1 px-4 py-8 sm:px-6 sm:py-10">
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
          />
        </main>

        {/* informação da loja / entrega / contacto */}
        {hasStoreInfo && (
          <section
            aria-labelledby="sf-info"
            className="border-t border-[var(--sf-border)] bg-[var(--sf-surface)]"
          >
            <div className="mx-auto w-full max-w-[var(--sf-container)] px-4 py-8 sm:px-6">
              <h2
                id="sf-info"
                className="mb-4 text-base font-semibold text-[var(--sf-fg)]"
              >
                {strings.storeInfo}
              </h2>

              <div className="grid gap-6 sm:grid-cols-3">
                {whatsappHref && (
                  <div className="space-y-1.5">
                    <p className="flex items-center gap-2 text-sm font-medium">
                      <WhatsAppIcon className="size-4" />
                      {strings.contact}
                    </p>
                    <a
                      href={whatsappHref}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 text-sm text-[var(--sf-muted)] underline-offset-4 hover:underline"
                    >
                      <Phone aria-hidden="true" className="size-3.5" />
                      {store.whatsapp_number}
                    </a>
                    <p className="text-sm text-[var(--sf-muted)]">
                      {strings.deliveryBody}
                    </p>
                  </div>
                )}

                {store.opening_hours && (
                  <div className="space-y-1.5">
                    <p className="flex items-center gap-2 text-sm font-medium">
                      <Clock aria-hidden="true" className="size-4 text-[var(--sf-primary)]" />
                      {strings.openingHours}
                    </p>
                    <p className="whitespace-pre-line text-sm text-[var(--sf-muted)]">
                      {store.opening_hours}
                    </p>
                  </div>
                )}

                {(store.instagram_url || store.facebook_url) && (
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium">{strings.followUs}</p>
                    <div className="flex gap-3">
                      {store.instagram_url && (
                        <a
                          href={store.instagram_url}
                          target="_blank"
                          rel="noreferrer"
                          aria-label="Instagram"
                          className="text-[var(--sf-muted)] transition-colors hover:text-[var(--sf-fg)]"
                        >
                          <Camera aria-hidden="true" className="size-5" />
                        </a>
                      )}
                      {store.facebook_url && (
                        <a
                          href={store.facebook_url}
                          target="_blank"
                          rel="noreferrer"
                          aria-label="Facebook"
                          className="text-[var(--sf-muted)] transition-colors hover:text-[var(--sf-fg)]"
                        >
                          <Globe aria-hidden="true" className="size-5" />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        <footer className="border-t border-[var(--sf-border)]">
          <div className="mx-auto flex w-full max-w-[var(--sf-container)] items-center justify-between gap-4 px-4 py-5 sm:px-6">
            <Link
              href="https://elicani.site"
              target="_blank"
              rel="noreferrer"
              className="opacity-70 transition-opacity hover:opacity-100"
              aria-label="Elicani"
            >
              <Logo variant="mono" className="h-4 text-[var(--sf-muted)]" />
            </Link>
            <span className="font-mono text-xs text-[var(--sf-muted)]">
              {store.currency}
            </span>
          </div>
        </footer>
      </CartProvider>
    </div>
  );
}
