"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import type {
  PublicCategory,
  PublicProduct,
} from "@/lib/catalog/types";
import type {
  ImageRatio,
  ProductLayout,
  StoreTemplate,
} from "@/lib/stores/appearance";
import { TEMPLATE_CLASSES } from "@/lib/storefront/theme";
import type { StorefrontStrings } from "@/lib/storefront/strings";
import { useOptionalCart } from "./cart-provider";
import { ProductCard, ProductRow } from "./product-card";

/**
 * Catálogo interativo da vitrine — busca + categorias + destaque + produtos.
 *
 * Um único componente serve a vitrine pública E o preview do painel
 * (`readOnly`), garantindo que o preview mostra o comportamento real.
 *
 * Busca: filtra o CONJUNTO de produtos já carregado (mesmos dados do
 * catálogo) — nada de infraestrutura de busca separada.
 */

export type CatalogAppearance = {
  template: StoreTemplate;
  product_layout: ProductLayout;
  image_ratio: ImageRatio;
};

export function StorefrontCatalog({
  products,
  categories,
  appearance,
  strings,
  currency,
  locale,
  onAdd,
  readOnly,
}: {
  products: PublicProduct[];
  categories: PublicCategory[];
  appearance: CatalogAppearance;
  strings: StorefrontStrings;
  currency: string;
  locale: Locale;
  /** Opcional: sem provider (preview) o catálogo fica somente leitura. */
  onAdd?: (product: PublicProduct) => void;
  readOnly?: boolean;
}) {
  const cart = useOptionalCart();
  const [query, setQuery] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState<string>("all");

  const handleAdd = (product: PublicProduct) => {
    if (readOnly) return;
    (onAdd ?? cart?.add)?.(product);
  };

  const classes = TEMPLATE_CLASSES[appearance.template];

  const featured = useMemo(
    () =>
      products.filter(
        (product) => product.is_featured && product.is_available,
      ),
    [products],
  );

  const normalizedQuery = query.trim().toLowerCase();

  const visible = useMemo(() => {
    return products.filter((product) => {
      if (activeCategoryId !== "all" && product.category_id !== activeCategoryId) {
        return false;
      }
      if (!normalizedQuery) return true;
      return (
        product.name.toLowerCase().includes(normalizedQuery) ||
        (product.description ?? "").toLowerCase().includes(normalizedQuery)
      );
    });
  }, [products, activeCategoryId, normalizedQuery]);

  const showFeatured =
    featured.length > 0 && !normalizedQuery && activeCategoryId === "all";

  const activeCategoryName =
    activeCategoryId === "all"
      ? null
      : (categories.find((category) => category.id === activeCategoryId)?.name ??
        null);

  const renderProducts = (list: PublicProduct[]) =>
    appearance.product_layout === "grid" ? (
      <div className="grid grid-cols-2 gap-[var(--sf-gap)] md:grid-cols-3 lg:grid-cols-4">
        {list.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            template={appearance.template}
            strings={strings}
            currency={currency}
            locale={locale}
            onAdd={handleAdd}
            readOnly={readOnly}
          />
        ))}
      </div>
    ) : (
      <div className="space-y-2.5">
        {list.map((product) => (
          <ProductRow
            key={product.id}
            product={product}
            template={appearance.template}
            strings={strings}
            currency={currency}
            locale={locale}
            onAdd={handleAdd}
            readOnly={readOnly}
          />
        ))}
      </div>
    );

  return (
    <div className="space-y-[var(--sf-section-gap)]">
      {/* busca */}
      <div className="relative mx-auto max-w-md">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-[var(--sf-muted)]"
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={strings.searchPlaceholder}
          aria-label={strings.searchPlaceholder}
          readOnly={readOnly}
          className="w-full rounded-[var(--sf-btn-radius)] border border-[var(--sf-border)] bg-[var(--sf-bg)] py-2.5 pe-3 ps-9 text-sm text-[var(--sf-fg)] outline-none placeholder:text-[var(--sf-muted)] focus-visible:ring-2 focus-visible:ring-[var(--sf-primary)]"
        />
      </div>

      {/* categorias */}
      {categories.length > 0 && (
        <nav aria-label={strings.categories}>
          <ul className="flex flex-wrap gap-2">
            <li>
              <button
                type="button"
                onClick={() => !readOnly && setActiveCategoryId("all")}
                aria-pressed={activeCategoryId === "all"}
                className={`rounded-[var(--sf-btn-radius)] px-3 py-1.5 text-sm transition-colors ${classes.chip} ${
                  activeCategoryId === "all"
                    ? "bg-[var(--sf-primary)] font-medium text-[var(--sf-on-primary)]"
                    : "bg-[var(--sf-surface)] text-[var(--sf-fg)] hover:opacity-80"
                }`}
              >
                {strings.allProducts}
              </button>
            </li>
            {categories.map((category) => {
              const active = category.id === activeCategoryId;
              return (
                <li key={category.id}>
                  <button
                    type="button"
                    onClick={() => !readOnly && setActiveCategoryId(category.id)}
                    aria-pressed={active}
                    className={`rounded-[var(--sf-btn-radius)] px-3 py-1.5 text-sm transition-colors ${classes.chip} ${
                      active
                        ? "bg-[var(--sf-primary)] font-medium text-[var(--sf-on-primary)]"
                        : "bg-[var(--sf-surface)] text-[var(--sf-fg)] hover:opacity-80"
                    }`}
                  >
                    {category.name}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      )}

      {/* destaques — só quando existem */}
      {showFeatured && (
        <section aria-labelledby="sf-featured">
          <h2
            id="sf-featured"
            className={`mb-4 text-lg text-[var(--sf-fg)] ${classes.heading}`}
          >
            {strings.featured}
          </h2>
          {renderProducts(featured)}
        </section>
      )}

      {/* catálogo completo */}
      <section aria-labelledby="sf-products">
        <h2
          id="sf-products"
          className={`mb-4 text-lg text-[var(--sf-fg)] ${classes.heading}`}
        >
          {activeCategoryName ?? strings.allProducts}
        </h2>

        {products.length === 0 ? (
          <div className="rounded-[var(--sf-radius)] border border-dashed border-[var(--sf-border)] px-6 py-12 text-center">
            <p className="text-sm font-medium text-[var(--sf-fg)]">
              {strings.noProducts}
            </p>
            <p className="mt-1 text-sm text-[var(--sf-muted)]">
              {strings.noProductsBody}
            </p>
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-[var(--sf-radius)] border border-dashed border-[var(--sf-border)] px-6 py-12 text-center">
            <p className="text-sm font-medium text-[var(--sf-fg)]">
              {strings.noResults}
            </p>
            <p className="mt-1 text-sm text-[var(--sf-muted)]">
              {strings.noResultsBody}
            </p>
          </div>
        ) : (
          renderProducts(visible)
        )}
      </section>
    </div>
  );
}
