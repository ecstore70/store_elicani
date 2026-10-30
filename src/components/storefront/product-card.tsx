"use client";

import { Plus, ShoppingBag } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { formatCurrency } from "@/lib/currency";
import type { PublicProduct } from "@/lib/catalog/types";
import {
  BUTTON_CLASSES,
  CARD_CLASSES,
  TEMPLATE_CLASSES,
} from "@/lib/storefront/theme";
import type { StoreTemplate } from "@/lib/stores/appearance";
import type { StorefrontStrings } from "@/lib/storefront/strings";

/**
 * Card/linha de produto — apresentação PURA, partilhada entre a vitrine
 * pública e o preview do painel (o preview usa os mesmos componentes, então
 * nunca "parece bem" mas difere da loja real).
 *
 * `readOnly` desliga as ações no preview; na vitrine real o botão adiciona
 * ao carrinho. Imagens nunca são distorcidas (object-cover + proporção
 * controlada por `--sf-img-ratio`).
 */

type ProductViewProps = {
  product: PublicProduct;
  template: StoreTemplate;
  strings: StorefrontStrings;
  currency: string;
  locale: Locale;
  onAdd: (product: PublicProduct) => void;
  readOnly?: boolean;
};

function ProductImage({
  product,
  strings,
}: {
  product: PublicProduct;
  strings: StorefrontStrings;
}) {
  if (product.image_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={product.image_url}
        alt={`${strings.productImageAlt}: ${product.name}`}
        loading="lazy"
        className="aspect-[var(--sf-img-ratio)] w-full object-cover"
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={strings.noImageAlt}
      className="flex aspect-[var(--sf-img-ratio)] w-full items-center justify-center bg-[var(--sf-surface)]"
    >
      <ShoppingBag aria-hidden="true" className="size-8 text-[var(--sf-muted)]" />
    </div>
  );
}

function Price({
  product,
  strings,
  currency,
  locale,
  className,
}: {
  product: PublicProduct;
  strings: StorefrontStrings;
  currency: string;
  locale: Locale;
  className?: string;
}) {
  const promo = product.promo_price;

  return (
    <p className={className}>
      {promo !== null ? (
        <>
          <span className="font-semibold text-[var(--sf-accent)]">
            {formatCurrency(promo, currency, locale)}
          </span>{" "}
          <span className="text-xs text-[var(--sf-muted)] line-through">
            {formatCurrency(product.price, currency, locale)}
          </span>
        </>
      ) : (
        formatCurrency(product.price, currency, locale)
      )}
      {!product.is_available && (
        <span className="ms-2 rounded-full bg-[var(--sf-surface)] px-2 py-0.5 text-[0.65rem] font-medium text-[var(--sf-muted)]">
          {strings.unavailable}
        </span>
      )}
    </p>
  );
}

function AddButton({
  product,
  strings,
  onAdd,
  readOnly,
  compact,
}: {
  product: PublicProduct;
  strings: StorefrontStrings;
  onAdd: (product: PublicProduct) => void;
  readOnly?: boolean;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <button
        type="button"
        disabled={readOnly || !product.is_available}
        onClick={() => onAdd(product)}
        aria-label={`${strings.addToCart}: ${product.name}`}
        className={`${BUTTON_CLASSES} !px-2.5 !py-2`}
      >
        <Plus aria-hidden="true" className="size-4" />
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={readOnly || !product.is_available}
      onClick={() => onAdd(product)}
      className={`${BUTTON_CLASSES} mt-1 w-full`}
    >
      {strings.addToCart}
    </button>
  );
}

/** Card de produto — grelha (grid). */
export function ProductCard({
  product,
  template,
  strings,
  currency,
  locale,
  onAdd,
  readOnly,
}: ProductViewProps) {
  const classes = TEMPLATE_CLASSES[template];

  return (
    <article
      className={`${CARD_CLASSES} ${classes.card} flex flex-col`}
      aria-label={product.name}
    >
      <div className={`overflow-hidden ${classes.image}`}>
        <ProductImage product={product} strings={strings} />
      </div>

      <div className="flex flex-1 flex-col gap-1 px-0.5 pt-2.5">
        <h3 className={`line-clamp-2 text-sm ${classes.heading}`}>{product.name}</h3>
        {product.description && (
          <p className="line-clamp-2 text-xs text-[var(--sf-muted)]">
            {product.description}
          </p>
        )}
        <Price
          product={product}
          strings={strings}
          currency={currency}
          locale={locale}
          className={`mt-auto pt-1 text-sm ${classes.price}`}
        />
        <AddButton
          product={product}
          strings={strings}
          onAdd={onAdd}
          readOnly={readOnly}
        />
      </div>
    </article>
  );
}

/** Linha de produto — lista (list): [IMAGEM] nome/descrição/preço  [+]. */
export function ProductRow({
  product,
  template,
  strings,
  currency,
  locale,
  onAdd,
  readOnly,
}: ProductViewProps) {
  const classes = TEMPLATE_CLASSES[template];

  return (
    <article
      className={`${CARD_CLASSES} ${classes.card} flex items-center gap-3`}
      aria-label={product.name}
    >
      <div className={`w-20 shrink-0 overflow-hidden sm:w-24 ${classes.image}`}>
        <ProductImage product={product} strings={strings} />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className={`line-clamp-1 text-sm ${classes.heading}`}>{product.name}</h3>
        {product.description && (
          <p className="mt-0.5 line-clamp-2 text-xs text-[var(--sf-muted)]">
            {product.description}
          </p>
        )}
        <Price
          product={product}
          strings={strings}
          currency={currency}
          locale={locale}
          className={`mt-1 text-sm ${classes.price}`}
        />
      </div>

      <AddButton
        product={product}
        strings={strings}
        onAdd={onAdd}
        readOnly={readOnly}
        compact
      />
    </article>
  );
}
