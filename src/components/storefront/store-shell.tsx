import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, Phone } from "lucide-react";
import { CartProvider } from "./cart-provider";
import { CartButton } from "./cart-button";
import { FooterSeals } from "./footer-seals";
import { ThemeVars } from "./theme-vars";
import { Logo } from "@/components/shared/logo";
import { LocaleSelector } from "@/components/shared/locale-selector";
import { SocialIcon } from "@/components/shared/social-icon";
import { WhatsAppIcon } from "@/components/shared/whatsapp-icon";
import { getLocaleDirection, type Locale } from "@/lib/i18n/config";
import { identifySocialNetwork, socialAriaLabel } from "@/lib/social";
import { hasPublicStoreFaq } from "@/lib/stores/queries";
import type { PublicStore } from "@/lib/stores/types";
import type { StorefrontStrings } from "@/lib/storefront/strings";
import type { StorefrontTheme } from "@/lib/storefront/theme";

/**
 * Chrome da vitrine pública, em DOIS modos:
 *
 *  • `storefront` (default) — capa, cabeçalho (identidade + idioma +
 *    CARRINHO sempre visível), conteúdo, informação da loja, rodapé e
 *    ação flutuante de WhatsApp (ícone oficial — nunca um círculo verde
 *    falso).
 *  • `checkout` — ECRÃ INDEPENDENTE: apenas a barra opaca "voltar +
 *    título". Nada da vitrine (capa, cabeçalho, secção de informação,
 *    rodapé, botão flutuante) emoldura ou aparece por trás do checkout —
 *    o cliente vê SÓ a superfície de compra, com fundo sólido do tema.
 *
 * Partilhado pela home, pelas páginas de produto e de documentos da
 * loja (terms/privacy/faq) e pelo checkout. O `CartProvider` envolve
 * tudo porque o botão do cabeçalho e o diálogo de carrinho (ecrã-cheio
 * no mobile, modal no desktop) partilham o mesmo estado; o checkout da
 * rota monta o seu `CheckoutProvider` por dentro (itens/subtotal vêm
 * do carrinho).
 */
export async function StoreShell({
  store,
  locale,
  languageLabel,
  strings,
  theme,
  variant = "storefront",
  children,
}: {
  store: PublicStore;
  locale: Locale;
  languageLabel: string;
  strings: StorefrontStrings;
  theme: StorefrontTheme;
  /**
   * `checkout` = superfície independente e opaca (sem chrome da
   * vitrine). Default `storefront` = página normal da loja.
   */
  variant?: "storefront" | "checkout";
  children: ReactNode;
}) {
  const isCheckout = variant === "checkout";
  const whatsappDigits = store.whatsapp_number?.replace(/\D/g, "") ?? "";
  const whatsappHref = whatsappDigits
    ? `https://wa.me/${whatsappDigits}`
    : null;

  // Links sociais configurados (apenas os DOIS campos existentes na base,
  // sem campos novos nem sistema duplicado), deduplicados por URL. O ícone
  // de cada ligação é decidido pela URL (hostname) — não pelo nome do
  // campo — através do mapa interno de `SocialIcon`.
  const socialLinks = Array.from(
    new Set([store.instagram_url, store.facebook_url]),
  ).filter((href): href is string => Boolean(href));

  const hasStoreInfo =
    Boolean(whatsappHref) ||
    Boolean(store.opening_hours) ||
    Boolean(store.instagram_url) ||
    Boolean(store.facebook_url);

  // ── rodapé: links de políticas da loja ────────────────────────────────
  // Só aparece conteúdo PUBLICADO (nunca link partido nem página em
  // branco): terms/privacy vêm dos campos públicos da própria loja; a
  // existência de FAQ é consultada com a credencial pública (RLS só
  // devolve itens de lojas ATIVAS; falha → link oculto, não arriscar
  // 404). O checkout não tem rodapé — lá a consulta é pulada.
  const hasFaq = isCheckout ? false : await hasPublicStoreFaq(store.id);
  const policyLinks = [
    ...(store.terms
      ? [{ href: `/store/${store.slug}/terms`, label: strings.termsLink }]
      : []),
    ...(store.privacy_policy
      ? [{ href: `/store/${store.slug}/privacy`, label: strings.privacyLink }]
      : []),
    ...(hasFaq
      ? [{ href: `/store/${store.slug}/faq`, label: strings.faqLink }]
      : []),
  ];

  return (
    <div
      dir={getLocaleDirection(locale)}
      style={theme.cssVars}
      className="flex min-h-svh flex-col bg-[var(--sf-bg)] text-[var(--sf-fg)]"
    >
      {/* variáveis no documento: o portal do diálogo do carrinho fica
          fora deste nó e precisa herdar o mesmo tema */}
      <ThemeVars vars={theme.cssVars} />
      <CartProvider
        storeId={store.id}
        storeSlug={store.slug}
        whatsappNumber={store.whatsapp_number}
        currency={store.currency}
        locale={locale}
        strings={strings}
      >
        {isCheckout ? (
          /* ── checkout: barra opaca própria (voltar + título) ───────────
             Nada da vitrine por trás: sem capa, sem cabeçalho da loja,
             sem secção de informação, sem rodapé, sem ação flutuante. */
          <header className="sticky top-0 z-20 border-b border-[var(--sf-border)] bg-[var(--sf-bg)]">
            <div className="mx-auto flex w-full max-w-[var(--sf-container)] items-center gap-3 px-4 py-3 sm:px-6">
              <Link
                href={`/store/${store.slug}`}
                className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-[var(--sf-btn-radius)] ps-1 pe-2 text-sm font-medium text-[var(--sf-fg)] transition-opacity hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sf-primary)]"
              >
                <ArrowLeft aria-hidden="true" className="size-5" />
                {strings.backToStore}
              </Link>
              <h1 className="min-w-0 flex-1 truncate text-base font-semibold sm:text-lg">
                {strings.checkout}
              </h1>
            </div>
          </header>
        ) : (
          <>
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

            {/* cabeçalho: logo + nome + descrição + idioma + carrinho */}
            <header className="border-b border-[var(--sf-border)]">
              <div className="mx-auto flex w-full max-w-[var(--sf-container)] items-center gap-3 px-4 py-4 sm:px-6">
                <Link
                  href={`/store/${store.slug}`}
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-[var(--sf-btn-radius)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sf-primary)]"
                >
                  {store.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={store.logo_url}
                      alt={store.name}
                      className="size-10 shrink-0 rounded-[var(--sf-radius)] object-cover"
                    />
                  ) : null}

                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold">
                      {store.name}
                    </p>
                    {store.description && (
                      <p className="truncate text-sm text-[var(--sf-muted)]">
                        {store.description}
                      </p>
                    )}
                  </div>
                </Link>

                {/* idioma da UI do visitante — não confundir com o conteúdo da loja */}
                <LocaleSelector
                  current={locale}
                  label={languageLabel}
                  align="end"
                  tone="storefront"
                  className="w-40 shrink-0"
                />

                {/* acesso claro ao carrinho (além do botão flutuante) */}
                <CartButton strings={strings} />
              </div>
            </header>
          </>
        )}

        <main className="mx-auto w-full max-w-[var(--sf-container)] flex-1 px-4 py-8 sm:px-6 sm:py-10">
          {children}
        </main>

        {/* informação da loja / entrega / contacto — só na vitrine */}
        {!isCheckout && hasStoreInfo && (
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

                {socialLinks.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium">{strings.followUs}</p>
                    <div className="flex gap-3">
                      {socialLinks.map((href) => (
                        <a
                          key={href}
                          href={href}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={socialAriaLabel(href)}
                          className="text-[var(--sf-muted)] transition-colors hover:text-[var(--sf-fg)]"
                        >
                          <SocialIcon network={identifySocialNetwork(href)} />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {!isCheckout && (
          /* Hierarquia do rodapé: identidade da loja → selos de
             capacidade → links de políticas → moeda + crédito da
             plataforma. Tudo centrado e COMPACTO: espaçamentos internos
             pequenos (pt-4 / gap-3 mobile) para o rodapé ocupar o mínimo
             vertical possível. A folga inferior NÃO é respiração — é o
             piso de altura do botão flutuante de WhatsApp (topo em64px +
             safe-area) para nada ficar coberto no mobile. */
          <footer className="border-t border-[var(--sf-border)]">
            <div className="mx-auto flex w-full max-w-[var(--sf-container)] flex-col items-center gap-3 px-4 pb-[calc(4.5rem_+_env(safe-area-inset-bottom))] pt-4 sm:gap-4 sm:px-6 sm:pb-6">
              {/* identidade do comerciante — âncora do rodapé (presente,
                  porém subordinada ao cabeçalho: texto pequeno) */}
              <p className="max-w-full truncate text-sm font-semibold text-[var(--sf-fg)]">
                {store.name}
              </p>

              {/* selos de capacidade — artes PNG fornecidas (public/brand),
                  otimizadas, informativos e não clicáveis */}
              <FooterSeals strings={strings} />

              {/* Políticas da loja — apenas links com conteúdo publicado
                  (calculados acima); centrados, texto pequeno. */}
              {policyLinks.length > 0 && (
                <nav
                  aria-label={strings.footerNav}
                  className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs"
                >
                  {policyLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="text-[var(--sf-muted)] underline-offset-4 transition-colors hover:text-[var(--sf-fg)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sf-primary)]"
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
              )}

              {/* moeda + atribuição da plataforma — chip discreto que
                  assina o rodapé; SEMPRE menor que a identidade da loja */}
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
                <span className="font-mono text-xs text-[var(--sf-muted)]">
                  {store.currency}
                </span>
                <Link
                  href="https://elicani.site"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--sf-border)] bg-[var(--sf-surface)] px-2.5 py-0.5 opacity-80 transition-opacity hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sf-primary)]"
                >
                  <Logo
                    variant="mono"
                    className="h-3.5 shrink-0 text-[var(--sf-muted)]"
                  />
                  <span className="text-xs font-medium text-[var(--sf-muted)]">
                    {strings.poweredBy}
                  </span>
                </Link>
              </div>
            </div>
          </footer>
        )}

        {/* CTA de WhatsApp sempre à mão — UMA única cápsula flutuante
            (ícone + "comprar agora" no mesmo link) no MESMO lado
            esquerdo do antigo botão circular (start-4 — a expansão
            cresce para a direita a partir do círculo original), fundo
            verde do WhatsApp (#008069) e pulso suave contínuo
            (`.sf-wa-cta`; o bloco global de `prefers-reduced-motion` do
            globals.css zera a animação). Nunca no checkout: a barra
            fixa do CTA ocupa o
            rodapé e nada da vitrine pode aparecer por cima dos campos.
            `bottom` + altura de 48px respeitam a safe-area (a folga do
            rodapé cobre o intervalo — nenhum selo/link/crédito fica
            embaixo dele). */}
        {!isCheckout && whatsappHref && (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            aria-label={strings.whatsappBuyAria}
            className="fixed bottom-[calc(1rem_+_env(safe-area-inset-bottom))] start-4 z-40 inline-flex items-center gap-2.5 rounded-full border border-[var(--sf-border)] bg-[#008069] py-1.5 pl-1.5 pr-4 shadow-lg transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sf-fg)] sm:bottom-[calc(1.5rem_+_env(safe-area-inset-bottom))] sm:start-6 sm:pr-5 sf-wa-cta"
          >
            <span className="flex size-9 items-center justify-center rounded-full bg-white">
              <WhatsAppIcon className="size-5" />
            </span>
            <span className="text-sm font-bold tracking-wide text-white sm:text-base">
              {strings.whatsappBuy}
            </span>
          </a>
        )}
      </CartProvider>
    </div>
  );
}
