"use client";

import { Monitor, ShoppingBag, Smartphone } from "lucide-react";
import { StorefrontCatalog } from "@/components/storefront/storefront-catalog";
import { getLocaleDirection, type Locale } from "@/lib/i18n/config";
import type { PublicCategory, PublicProduct } from "@/lib/catalog/types";
import {
  normalizeAppearance,
  type AppearanceValues,
} from "@/lib/stores/appearance";
import { createTranslator } from "@/lib/i18n/translate";
import { resolveTheme } from "@/lib/storefront/theme";
import { buildStorefrontStrings } from "@/lib/storefront/strings";
import { cn } from "@/lib/utils";

/**
 * Preview da vitrine — reutiliza os MESMOS componentes da loja pública
 * (`StorefrontCatalog`, tema resolvido pelo mesmo `resolveTheme`) com os
 * produtos e categorias REAIS do comerciante. Modo somente leitura: não
 * toca no carrinho real nem persiste nada.
 *
 * O toggle Mobile|Desktop muda a largura do quadro — no mobile o cliente
 * vê exatamente a experiência que a maioria dos visitantes terá.
 */

export type PreviewAppearance = Partial<AppearanceValues> & {
  template: AppearanceValues["template"];
  product_layout: AppearanceValues["product_layout"];
  image_ratio: AppearanceValues["image_ratio"];
  button_style: AppearanceValues["button_style"];
  card_style: AppearanceValues["card_style"];
};

export function StorefrontPreview({
  device,
  onDeviceChange,
  store,
  appearance,
  products,
  categories,
  locale,
}: {
  device: "mobile" | "desktop";
  onDeviceChange: (device: "mobile" | "desktop") => void;
  store: {
    name: string;
    description: string | null;
    logo_url: string | null;
    currency: string;
  };
  appearance: PreviewAppearance;
  products: PublicProduct[];
  categories: PublicCategory[];
  locale: Locale;
}) {
  const t = createTranslator(locale);
  const strings = buildStorefrontStrings(t);

  const theme = resolveTheme(normalizeAppearance(appearance));

  return (
    <section aria-label={t("appearance.preview")} className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold tracking-tight">
          {t("appearance.preview")}
        </h2>

        <div
          role="group"
          aria-label={t("appearance.previewDevice")}
          className="inline-flex rounded-lg border border-input p-0.5"
        >
          <button
            type="button"
            onClick={() => onDeviceChange("mobile")}
            aria-pressed={device === "mobile"}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
              device === "mobile"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Smartphone aria-hidden="true" className="size-3.5" />
            {t("appearance.previewMobile")}
          </button>
          <button
            type="button"
            onClick={() => onDeviceChange("desktop")}
            aria-pressed={device === "desktop"}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
              device === "desktop"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Monitor aria-hidden="true" className="size-3.5" />
            {t("appearance.previewDesktop")}
          </button>
        </div>
      </div>

      <div
        dir={getLocaleDirection(locale)}
        style={theme.cssVars}
        className={cn(
          "mx-auto w-full overflow-hidden rounded-xl border border-border/70 bg-[var(--sf-bg)] text-[var(--sf-fg)] shadow-sm transition-[max-width] duration-300",
          device === "mobile" ? "max-w-[375px]" : "max-w-full",
        )}
      >
        <div
          className="max-h-[560px] overflow-y-auto"
          aria-hidden="false"
        >
          {/* mini cabeçalho — mesma estrutura da vitrine real */}
          <div className="flex items-center gap-3 border-b border-[var(--sf-border)] px-4 py-3">
            {store.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={store.logo_url}
                alt=""
                className="size-8 rounded-[var(--sf-radius)] object-cover"
              />
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{store.name}</p>
              {store.description && (
                <p className="truncate text-xs text-[var(--sf-muted)]">
                  {store.description}
                </p>
              )}
            </div>
            <ShoppingBag aria-hidden="true" className="size-4 text-[var(--sf-muted)]" />
          </div>

          <div className="px-4 py-5">
            <StorefrontCatalog
              products={products}
              categories={categories}
              appearance={{
                template: theme.template,
                product_layout: appearance.product_layout,
                image_ratio: appearance.image_ratio,
              }}
              strings={strings}
              currency={store.currency}
              locale={locale}
              readOnly
            />
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {t("appearance.previewHint")}
      </p>
    </section>
  );
}
