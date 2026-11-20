"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import type {
  PublicCategory,
  PublicProduct,
} from "@/lib/catalog/types";
import { categorySlugOrId } from "@/lib/catalog/category-slug";
import { productSlugOrId } from "@/lib/catalog/product-slug";
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
 *
 * Categorias: na vitrine real (com `storeSlug`) os chips são LINKS reais
 * para `/store/{slug}/categories/{id-ou-slug}` (navegação indexável,
 * aprimoramento progressivo); no preview/landing continuam botões de
 * filtro client-side — mesmo visual nos dois modos.
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
  storeSlug,
  activeCategoryId: initialCategoryId,
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
  /**
   * Com o slug, os cards levam à página de produto
   * (`/store/{slug}/products/{id}`). O preview não envia → cards inertes.
   */
  storeSlug?: string;
  /**
   * Categoria ATUAL da página (rota `/store/{slug}/categories/…`) — o
   * chip correspondente fica ativo (`aria-current`). Só tem efeito em
   * modo link (com `storeSlug`); no preview/landing o filtro continua
   * em estado local.
   */
  activeCategoryId?: string;
}) {
  const cart = useOptionalCart();
  const [query, setQuery] = useState("");
  const [filterCategoryId, setFilterCategoryId] = useState<string>("all");

  const handleAdd = (product: PublicProduct) => {
    if (readOnly) return;
    (onAdd ?? cart?.add)?.(product);
  };

  const classes = TEMPLATE_CLASSES[appearance.template];

  // Chips de categoria como LINKS REAIS na vitrine real (com slug): a
  // navegação de categoria vira URL indexável
  // (`/store/{slug}/categories/{id-ou-slug}`) — aprimoramento progressivo
  // que preserva o visual e o comportamento dos chips. Sem slug (preview
  // da landing/painel) os chips continuam botões de filtro client-side.
  const categoryIndexHref =
    !readOnly && storeSlug ? `/store/${storeSlug}` : null;
  const activeCategoryId = categoryIndexHref
    ? (initialCategoryId ?? "all")
    : filterCategoryId;

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

  const productHref = (product: PublicProduct): string | null =>
    storeSlug && !readOnly
      ? `/store/${storeSlug}/products/${productSlugOrId(product)}`
      : null;

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
            href={productHref(product)}
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
            href={productHref(product)}
          />
        ))}
      </div>
    );

  /** Visual dos chips idêntico ao original (mesmas classes, ativo/inativo). */
  const chipClass = (active: boolean) =>
    `rounded-[var(--sf-btn-radius)] px-3 py-1.5 text-sm transition-colors ${classes.chip} ${
      active
        ? "bg-[var(--sf-primary)] font-medium text-[var(--sf-on-primary)]"
        : "bg-[var(--sf-surface)] text-[var(--sf-fg)] hover:opacity-80"
    }`;

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

      {/* categorias — na vitrine real os chips são LINKS reais
          (/store/{slug}/categories/{id-ou-slug}): navegação crawlável
          preservando o visual; sem slug (preview) mantêm-se os botões
          de filtro client-side de sempre. */}
      {categories.length > 0 && (
        <nav aria-label={strings.categories}>
          <ul className="flex flex-wrap gap-2">
            <li>
              {categoryIndexHref ? (
                <Link
                  href={categoryIndexHref}
                  aria-current={activeCategoryId === "all" ? "page" : undefined}
                  className={chipClass(activeCategoryId === "all")}
                >
                  {strings.allProducts}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => !readOnly && setFilterCategoryId("all")}
                  aria-pressed={activeCategoryId === "all"}
                  className={chipClass(activeCategoryId === "all")}
                >
                  {strings.allProducts}
                </button>
              )}
            </li>
            {categories.map((category) => {
              const active = category.id === activeCategoryId;
              return (
                <li key={category.id}>
                  {categoryIndexHref ? (
                    <Link
                      href={`${categoryIndexHref}/categories/${categorySlugOrId(category)}`}
                      aria-current={active ? "page" : undefined}
                      className={chipClass(active)}
                    >
                      {category.name}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        !readOnly && setFilterCategoryId(category.id)
                      }
                      aria-pressed={active}
                      className={chipClass(active)}
                    >
                      {category.name}
                    </button>
                  )}
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
