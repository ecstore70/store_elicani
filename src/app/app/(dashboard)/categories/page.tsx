import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/page-header";
import { CategoryManager } from "@/components/categories/category-manager";
import { requireUser } from "@/lib/auth/session";
import { listCategoriesForOwner } from "@/lib/catalog/queries";
import { getLocale } from "@/lib/i18n/locale";
import { createTranslator } from "@/lib/i18n/translate";
import { requireStore } from "@/lib/stores/queries";

export async function generateMetadata(): Promise<Metadata> {
  const t = createTranslator(await getLocale());
  return { title: t("categories.title") };
}

/**
 * Categorias da própria loja — criação, edição, ativação, remoção e
 * ordenação simples. RLS garante o isolamento por loja.
 */
export default async function CategoriesPage() {
  const user = await requireUser();
  const store = await requireStore(user.id);

  const categories = await listCategoriesForOwner(store.id);
  const locale = await getLocale();
  const t = createTranslator(locale);

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("categories.title")}
        description={t("categories.subtitle")}
      />
      <CategoryManager categories={categories} locale={locale} />
    </div>
  );
}
