"use client";

import type { Locale } from "@/lib/i18n/config";
import type { PublicProduct } from "@/lib/catalog/types";
import type { StoreTemplate } from "@/lib/stores/appearance";
import type { StorefrontStrings } from "@/lib/storefront/strings";
import { useOptionalCart } from "./cart-provider";
import { ProductCard } from "./product-card";

/**
 * "Também pode gostar" — grelha compacta dos produtos relacionados na
 * página de produto. Fora do provider (preview) fica somente leitura.
 */
export function RelatedProducts({
  products,
  template,
  strings,
  currency,
  locale,
  storeSlug,
}: {
  products: PublicProduct[];
  template: StoreTemplate;
  strings: StorefrontStrings;
  currency: string;
  locale: Locale;
  storeSlug: string;
}) {
  const cart = useOptionalCart();

  if (products.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-[var(--sf-gap)] md:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          template={template}
          strings={strings}
          currency={currency}
          locale={locale}
          onAdd={cart?.add}
          readOnly={!cart}
          href={`/store/${storeSlug}/products/${product.id}`}
        />
      ))}
    </div>
  );
}
