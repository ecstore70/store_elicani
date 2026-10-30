import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/page-header";
import { ProductForm } from "@/components/products/product-form";
import { requireUser } from "@/lib/auth/session";
import { listCategoriesWithStoreForOwner } from "@/lib/catalog/queries";
import { getLocale } from "@/lib/i18n/locale";
import { createTranslator } from "@/lib/i18n/translate";
import { requireStore } from "@/lib/stores/queries";

export const metadata: Metadata = {
  title: "New product",
};

export default async function NewProductPage() {
  const user = await requireUser();
  const store = await requireStore(user.id);

  const categories = await listCategoriesWithStoreForOwner(store.id);
  const locale = await getLocale();
  const t = createTranslator(locale);

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("products.new")}
        description={t("products.newSubtitle")}
      />
      <ProductForm locale={locale} categories={categories} />
    </div>
  );
}
