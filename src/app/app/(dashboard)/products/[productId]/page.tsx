import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { ProductForm } from "@/components/products/product-form";
import { requireUser } from "@/lib/auth/session";
import {
  getProductForOwner,
  listCategoriesWithStoreForOwner,
} from "@/lib/catalog/queries";
import { getLocale } from "@/lib/i18n/locale";
import { createTranslator } from "@/lib/i18n/translate";
import { requireStore } from "@/lib/stores/queries";

export async function generateMetadata(): Promise<Metadata> {
  const t = createTranslator(await getLocale());
  return { title: t("products.edit") };
}

type Props = { params: Promise<{ productId: string }> };

/** Edição de produto da PRÓPRIA loja (RLS + filtro por store_id). */
export default async function EditProductPage({ params }: Props) {
  const { productId } = await params;

  const user = await requireUser();
  const store = await requireStore(user.id);

  const [product, categories] = await Promise.all([
    getProductForOwner(store.id, productId),
    listCategoriesWithStoreForOwner(store.id),
  ]);

  if (!product) {
    notFound();
  }

  const locale = await getLocale();
  const t = createTranslator(locale);

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("products.edit")}
        description={product.name}
      />
      <ProductForm
        locale={locale}
        productId={product.id}
        categories={categories}
        initialValues={{
          name: product.name,
          description: product.description ?? "",
          price: String(product.price),
          promo_price: product.promo_price !== null ? String(product.promo_price) : "",
          category_id: product.category_id ?? "",
          image_url: product.image_url ?? "",
          is_available: product.is_available ? "true" : "",
          is_featured: product.is_featured ? "true" : "",
        }}
      />
    </div>
  );
}
