import { MessageCircle, ShoppingBag } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { formatCurrency } from "@/lib/currency";
import { createTranslator } from "@/lib/i18n/translate";
import { normalizeAppearance } from "@/lib/stores/appearance";
import { resolveTheme } from "@/lib/storefront/theme";
import { buildStorefrontStrings } from "@/lib/storefront/strings";
import type { StorefrontStrings } from "@/lib/storefront/strings";
import { ProductCard } from "@/components/storefront/product-card";
import { StorefrontCatalog } from "@/components/storefront/storefront-catalog";
import { BrowserFrame } from "./browser-frame";
import {
  SAMPLE_APPEARANCE,
  SAMPLE_CATEGORIES,
  SAMPLE_CART_COUNT,
  SAMPLE_CART_SUBTOTAL,
  SAMPLE_HERO_PRODUCTS,
  SAMPLE_PRODUCTS,
  SAMPLE_STORE,
} from "./sample-store";

/**
 * Visuais de produto para a landing — construídos com os MESMOS componentes
 * da vitrine real (`ProductCard`, tema via `resolveTheme`, strings via
 * `buildStorefrontStrings`), em modo somente leitura.
 *
 * Conteúdo do comerciante (nome/descrição da loja, produtos, categorias)
 * é dado de amostra e NÃO passa pela tradução — apenas os rótulos de
 * sistema vêm das chaves i18n.
 */

function MiniHeader() {
  return (
    <div className="flex items-center gap-2.5 border-b border-[var(--sf-border)] pb-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--sf-primary)] text-sm font-semibold text-[var(--sf-on-primary)]">
        N
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{SAMPLE_STORE.name}</p>
        <p className="truncate text-xs text-[var(--sf-muted)]">
          {SAMPLE_STORE.description}
        </p>
      </div>
      <span className="relative shrink-0">
        <ShoppingBag aria-hidden="true" className="size-5 text-[var(--sf-muted)]" />
        <span className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-[var(--sf-primary)] text-[10px] font-semibold text-[var(--sf-on-primary)]">
          {SAMPLE_CART_COUNT}
        </span>
      </span>
    </div>
  );
}

function SampleChips({ strings }: { strings: StorefrontStrings }) {
  return (
    <ul className="flex flex-wrap gap-2">
      <li>
        <span className="rounded-[var(--sf-btn-radius)] bg-[var(--sf-primary)] px-3 py-1.5 text-sm font-medium text-[var(--sf-on-primary)]">
          {strings.allProducts}
        </span>
      </li>
      {/* Categorias são conteúdo do comerciante — ficam como estão. */}
      {SAMPLE_CATEGORIES.map((category) => (
        <li key={category.id}>
          <span className="rounded-[var(--sf-btn-radius)] bg-[var(--sf-surface)] px-3 py-1.5 text-sm text-[var(--sf-fg)]">
            {category.name}
          </span>
        </li>
      ))}
    </ul>
  );
}

function useSampleTheme() {
  return resolveTheme(normalizeAppearance(SAMPLE_APPEARANCE));
}

/**
 * Visual do hero: vitrine real em moldura de navegador + balão de
 * confirmação de encomenda por WhatsApp.
 */
export function HeroStorefront({ locale }: { locale: Locale }) {
  const t = createTranslator(locale);
  const strings = buildStorefrontStrings(t);
  const theme = useSampleTheme();

  return (
    <div className="relative mx-auto w-full max-w-lg lg:max-w-none" aria-hidden="true">
      <BrowserFrame url="nova-moda.elicani.site">
        <div
          style={theme.cssVars}
          className="bg-[var(--sf-bg)] p-3 text-[var(--sf-fg)] sm:p-4"
        >
          <MiniHeader />
          <div className="mt-3">
            <SampleChips strings={strings} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-[var(--sf-gap)]">
            {SAMPLE_HERO_PRODUCTS.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                template={theme.template}
                strings={strings}
                currency={SAMPLE_STORE.currency}
                locale={locale}
                readOnly
              />
            ))}
          </div>
        </div>
      </BrowserFrame>

      <div className="absolute -bottom-4 left-4 hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 shadow-[0_14px_30px_-16px_rgba(15,23,42,0.35)] sm:flex">
        <span className="flex size-6 items-center justify-center rounded-full bg-[#22c55e]">
          <MessageCircle aria-hidden="true" className="size-3.5 text-white" />
        </span>
        <span className="text-xs font-medium text-slate-800">
          {t("landing.pillOrder")}
        </span>
      </div>
    </div>
  );
}

/**
 * Telemóvel com a experiência mobile da loja: cabeçalho, categorias,
 * card de produto e barra de carrinho com pedido por WhatsApp.
 */
export function PhoneStorefront({ locale }: { locale: Locale }) {
  const t = createTranslator(locale);
  const strings = buildStorefrontStrings(t);
  const theme = useSampleTheme();
  const itemsLabel =
    SAMPLE_CART_COUNT === 1
      ? t("landing.demoItemsOne", { count: SAMPLE_CART_COUNT })
      : t("landing.demoItemsMany", { count: SAMPLE_CART_COUNT });

  return (
    <div
      aria-hidden="true"
      className="w-[272px] shrink-0 rounded-[2.25rem] border-[7px] border-slate-900 bg-slate-900 shadow-[0_28px_60px_-30px_rgba(15,23,42,0.5)]"
    >
      <div
        style={theme.cssVars}
        className="overflow-hidden rounded-[1.75rem] bg-[var(--sf-bg)] text-[var(--sf-fg)]"
      >
        <div className="flex justify-center bg-[var(--sf-surface)] py-1.5">
          <span className="h-1.5 w-16 rounded-full bg-slate-300" />
        </div>

        <div className="px-3 pt-3">
          <MiniHeader />
          <div className="mt-3">
            <SampleChips strings={strings} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-[var(--sf-gap)]">
            {SAMPLE_HERO_PRODUCTS.slice(0, 2).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                template={theme.template}
                strings={strings}
                currency={SAMPLE_STORE.currency}
                locale={locale}
                readOnly
              />
            ))}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 border-t border-[var(--sf-border)] px-3 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-[11px] font-semibold">{itemsLabel}</p>
            <p className="truncate text-[11px] text-[var(--sf-muted)]">
              {strings.subtotal}:{" "}
              {formatCurrency(
                SAMPLE_CART_SUBTOTAL,
                SAMPLE_STORE.currency,
                locale,
              )}
            </p>
          </div>
          <span className="shrink-0 rounded-[var(--sf-btn-radius)] bg-[var(--sf-button)] px-2.5 py-2 text-[11px] font-medium text-[var(--sf-on-button)]">
            {strings.orderWhatsApp}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Showcase da secção "loja pública": moldura com o catálogo COMPLETO
 * (busca + categorias + destaque + produtos) pelo mesmo `StorefrontCatalog`
 * da vitrine real, ao lado do telemóvel com a experiência mobile.
 */
export function StorefrontSectionVisual({ locale }: { locale: Locale }) {
  const t = createTranslator(locale);
  const strings = buildStorefrontStrings(t);
  const theme = useSampleTheme();

  return (
    <div className="flex w-full items-center justify-center gap-6">
      <div className="min-w-0 max-w-4xl flex-1">
        <BrowserFrame url="nova-moda.elicani.site">
          <div
            style={theme.cssVars}
            className="bg-[var(--sf-bg)] p-3 text-[var(--sf-fg)] sm:p-4"
          >
            <MiniHeader />
            <div className="mt-4">
              <StorefrontCatalog
                products={SAMPLE_PRODUCTS}
                categories={SAMPLE_CATEGORIES}
                appearance={{
                  template: theme.template,
                  product_layout: SAMPLE_APPEARANCE.product_layout,
                  image_ratio: SAMPLE_APPEARANCE.image_ratio,
                }}
                strings={strings}
                currency={SAMPLE_STORE.currency}
                locale={locale}
                readOnly
              />
            </div>
          </div>
        </BrowserFrame>
      </div>

      <div className="hidden shrink-0 lg:block">
        <PhoneStorefront locale={locale} />
      </div>
    </div>
  );
}
