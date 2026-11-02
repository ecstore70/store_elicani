import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { StoreShell } from "@/components/storefront/store-shell";
import { ProductPurchase } from "@/components/storefront/product-purchase";
import { RelatedProducts } from "@/components/storefront/related-products";
import { getPublicCatalog } from "@/lib/catalog/queries";
import { formatCurrency } from "@/lib/currency";
import { normalizeLocale } from "@/lib/i18n/config";
import { getLocaleChoice, getTranslator } from "@/lib/i18n/locale";
import { createTranslator } from "@/lib/i18n/translate";
import { normalizeAppearance } from "@/lib/stores/appearance";
import { storePublicUrl } from "@/lib/stores/resolve";
import { getPublicStoreBySlug } from "@/lib/stores/queries";
import { discountPercent } from "@/lib/storefront/product-options";
import { buildStorefrontStrings } from "@/lib/storefront/strings";
import { resolveTheme, TEMPLATE_CLASSES } from "@/lib/storefront/theme";

type Props = {
  params: Promise<{ slug: string; productId: string }>;
};

/** Resolve loja + produto no Supabase a cada requisição — sem cache. */
export const instant = false;

/**
 * Carrega loja, produto, categoria e relacionados num só ponto (usado
 * pela página E pelas metadados). Produto não encontrado (ou loja
 * inativa) → `null` → 404 real, com status correto.
 */
async function loadProduct(slug: string, productId: string) {
  const store = await getPublicStoreBySlug(slug);
  if (!store) return null;

  const catalog = await getPublicCatalog(store.id);
  const product =
    catalog.products.find((item) => item.id === productId) ?? null;
  if (!product) return null;

  const category =
    catalog.categories.find((item) => item.id === product.category_id) ?? null;

  // "Também pode gostar": mesma categoria primeiro, no máximo 4.
  const related = [...catalog.products]
    .filter((item) => item.id !== product.id && item.is_available)
    .sort(
      (a, b) =>
        Number(b.category_id === product.category_id) -
        Number(a.category_id === product.category_id),
    )
    .slice(0, 4);

  return { store, product, category, related };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, productId } = await params;
  const loaded = await loadProduct(slug, productId);

  if (!loaded) {
    const t = await getTranslator();
    return { title: t("storefront.notFound") };
  }

  const { store, product } = loaded;
  const description =
    product.description ?? `${product.name} — ${store.name}`;

  return {
    title: product.name,
    description,
    openGraph: {
      title: product.name,
      description,
      ...(product.image_url ? { images: [product.image_url] } : {}),
    },
  };
}

/**
 * Página de produto da vitrine — imagem grande (sem cortes: `object-contain`),
 * hierarquia de preço (promoção + desconto %), disponibilidade, quantidade,
 * opções (estrutura genérica, só renderiza quando configuradas), adicionar
 * ao carrinho e ação de WhatsApp. A compra continua a fechar no carrinho e
 * na mensagem estruturada de WhatsApp — nenhum checkout de servidor.
 */
export default async function ProductPage({ params }: Props) {
  const { slug, productId } = await params;
  const loaded = await loadProduct(slug, productId);

  if (!loaded) {
    notFound();
  }

  const { store, product, category, related } = loaded;

  const visitorChoice = await getLocaleChoice();
  const locale = visitorChoice ?? normalizeLocale(store.language);
  const t = createTranslator(locale);
  const strings = buildStorefrontStrings(t);

  const appearance = normalizeAppearance(store);
  const theme = resolveTheme(appearance);
  const classes = TEMPLATE_CLASSES[theme.template];

  const whatsappDigits = store.whatsapp_number?.replace(/\D/g, "") ?? "";
  const whatsappHref = whatsappDigits
    ? `https://wa.me/${whatsappDigits}`
    : null;
  const productUrl = `${storePublicUrl(store.slug)}/store/${store.slug}/products/${product.id}`;
  const discount = discountPercent(product.price, product.promo_price);

  return (
    <StoreShell
      store={store}
      locale={locale}
      languageLabel={t("locale.changeLanguage")}
      strings={strings}
      theme={theme}
    >
      <nav className="mb-5">
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-[var(--sf-muted)]">
          <li>
            <Link
              href={`/store/${store.slug}`}
              className="underline-offset-4 hover:text-[var(--sf-fg)] hover:underline"
            >
              {strings.backToStore}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="min-w-0 truncate text-[var(--sf-fg)]">
            {product.name}
          </li>
        </ol>
      </nav>

      <article className="grid gap-6 lg:grid-cols-2 lg:gap-10">
        {/* imagem grande — produto completo, sem cortes feios */}
        <div className="relative overflow-hidden rounded-[var(--sf-radius)] border border-[var(--sf-border)] bg-[var(--sf-surface)]">
          {product.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.image_url}
              alt={`${strings.productImageAlt}: ${product.name}`}
              className="aspect-square w-full object-contain p-4 sm:p-6"
            />
          ) : (
            <div
              role="img"
              aria-label={strings.noImageAlt}
              className="flex aspect-square w-full items-center justify-center"
            >
              <ShoppingBag
                aria-hidden="true"
                className="size-12 text-[var(--sf-muted)]"
              />
            </div>
          )}

          {discount > 0 && (
            <span className="absolute start-3 top-3 rounded-[var(--sf-btn-radius)] bg-[var(--sf-accent)] px-2 py-1 text-xs font-semibold leading-none text-[var(--sf-on-accent)] shadow-sm">
              {`-${discount}%`}
            </span>
          )}
        </div>

        {/* identidade + preço + compra + descrição */}
        <div className="flex flex-col gap-4">
          <div>
            {category && (
              <p className="mb-1 text-sm text-[var(--sf-muted)]">
                {category.name}
              </p>
            )}
            <h1 className={`text-xl leading-tight sm:text-2xl ${classes.heading}`}>
              {product.name}
            </h1>
          </div>

          {/* bloco de preço: promoção grande + preço riscado + selo % */}
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
            {product.promo_price !== null ? (
              <>
                <span className="text-2xl font-semibold tabular-nums text-[var(--sf-accent)]">
                  {formatCurrency(product.promo_price, store.currency, locale)}
                </span>
                <span className="text-base tabular-nums text-[var(--sf-muted)] line-through">
                  {formatCurrency(product.price, store.currency, locale)}
                </span>
                {discount > 0 && (
                  <span className="rounded-[var(--sf-btn-radius)] bg-[var(--sf-accent)] px-2 py-0.5 text-xs font-semibold leading-none text-[var(--sf-on-accent)]">
                    {`-${discount}%`}
                  </span>
                )}
              </>
            ) : (
              <span className="text-2xl font-semibold tabular-nums">
                {formatCurrency(product.price, store.currency, locale)}
              </span>
            )}

            {!product.is_available && (
              <span className="rounded-[var(--sf-btn-radius)] border border-[var(--sf-border)] bg-[var(--sf-surface)] px-2 py-0.5 text-xs font-medium text-[var(--sf-muted)]">
                {strings.unavailable}
              </span>
            )}
          </div>

          <ProductPurchase
            product={product}
            storeName={store.name}
            productUrl={productUrl}
            whatsappHref={whatsappHref}
            strings={strings}
            currency={store.currency}
            locale={locale}
          />

          {product.description && (
            <section
              aria-labelledby="sf-description"
              className="border-t border-[var(--sf-border)] pt-4"
            >
              <h2
                id="sf-description"
                className={`mb-2 text-base ${classes.heading}`}
              >
                {strings.productDescription}
              </h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--sf-muted)]">
                {product.description}
              </p>
            </section>
          )}
        </div>
      </article>

      {related.length > 0 && (
        <section aria-labelledby="sf-related" className="mt-10 sm:mt-12">
          <h2 id="sf-related" className={`mb-4 text-lg ${classes.heading}`}>
            {strings.relatedProducts}
          </h2>
          <RelatedProducts
            products={related}
            template={theme.template}
            strings={strings}
            currency={store.currency}
            locale={locale}
            storeSlug={store.slug}
          />
        </section>
      )}
    </StoreShell>
  );
}
