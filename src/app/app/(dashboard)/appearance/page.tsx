import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/page-header";
import { AppearanceForm } from "@/components/appearance/appearance-form";
import { requireUser } from "@/lib/auth/session";
import { getLocale } from "@/lib/i18n/locale";
import { createTranslator } from "@/lib/i18n/translate";
import { listCategoriesForOwner, listProductsForOwner } from "@/lib/catalog/queries";
import { requireStore } from "@/lib/stores/queries";

export async function generateMetadata(): Promise<Metadata> {
  const t = createTranslator(await getLocale());
  return { title: t("nav.appearance") };
}

/**
 * Loja → Aparência — template, cores, layout e estilos, com preview ao vivo
 * usando dados REAIS do comerciante (produtos e categorias próprios).
 */
export default async function AppearancePage() {
  const user = await requireUser();
  const store = await requireStore(user.id);

  const locale = await getLocale();
  const t = createTranslator(locale);

  // Dados realistas para o preview: até 6 produtos + as categorias da loja.
  const [products, categories] = await Promise.all([
    listProductsForOwner(store.id),
    listCategoriesForOwner(store.id),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("appearance.title")}
        description={t("appearance.subtitle")}
      />

      <AppearanceForm
        locale={locale}
        store={{
          slug: store.slug,
          name: store.name,
          description: store.description,
          logo_url: store.logo_url,
          banner_url: store.banner_url,
          whatsapp_number: store.whatsapp_number,
          currency: store.currency,
          template: store.template,
          primary_color: store.primary_color,
          button_color: store.button_color,
          accent_color: store.accent_color,
          background_color: store.background_color,
          product_layout: store.product_layout,
          image_ratio: store.image_ratio,
          button_style: store.button_style,
          card_style: store.card_style,
        }}
        preview={{
          products: products.slice(0, 6),
          categories,
        }}
      />
    </div>
  );
}
