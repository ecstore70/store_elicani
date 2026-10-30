import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { ProductTable } from "@/components/products/product-table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import {
  listCategoriesWithStoreForOwner,
  listProductsForOwner,
} from "@/lib/catalog/queries";
import { getLocale } from "@/lib/i18n/locale";
import { createTranslator } from "@/lib/i18n/translate";
import { requireStore } from "@/lib/stores/queries";

export const metadata: Metadata = {
  title: "Products",
};

/**
 * Produtos da própria loja — o RLS garante que cada comerciante vê e
 * gerencia APENAS o catálogo da sua loja.
 */
export default async function ProductsPage() {
  const user = await requireUser();
  const store = await requireStore(user.id);

  const [products, categories] = await Promise.all([
    listProductsForOwner(store.id),
    listCategoriesWithStoreForOwner(store.id),
  ]);

  const locale = await getLocale();
  const t = createTranslator(locale);

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("nav.products")}
        description={t("products.subtitle")}
        action={
          <Button asChild>
            <Link href="/app/products/new">
              <Plus aria-hidden="true" data-icon="inline-start" className="size-4" />
              {t("products.new")}
            </Link>
          </Button>
        }
      />

      {products.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base tracking-tight">
              {t("products.empty")}
            </CardTitle>
            <CardDescription>{t("products.emptyBody")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/app/products/new">
                <Plus aria-hidden="true" data-icon="inline-start" className="size-4" />
                {t("products.new")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ProductTable
          products={products}
          categories={categories}
          currency={store.currency}
          locale={locale}
        />
      )}
    </div>
  );
}
