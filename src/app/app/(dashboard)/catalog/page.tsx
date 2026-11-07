import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/page-header";
import { CatalogManager } from "@/components/catalog/catalog-manager";
import { requireUser } from "@/lib/auth/session";
import { getLocale } from "@/lib/i18n/locale";
import { createTranslator } from "@/lib/i18n/translate";
import { requireStore } from "@/lib/stores/queries";

export async function generateMetadata(): Promise<Metadata> {
  const t = createTranslator(await getLocale());
  return { title: t("nav.catalog") };
}

/**
 * Gestão do ciclo de vida do catálogo: estado público (ativo/inativo),
 * ativar/desativar com confirmação e exclusão destrutiva com confirmação
 * digitada. A loja É o catálogo nesta arquitetura — ver src/lib/stores/actions.ts.
 *
 * RLS garante que cada comerciante só enxerga e gerencia a PRÓPRIA loja;
 * a página é só a apresentação, toda mutação passa pelas server actions.
 */
export default async function CatalogPage() {
  const user = await requireUser();
  const store = await requireStore(user.id);

  const locale = await getLocale();
  const t = createTranslator(locale);

  return (
    <div className="space-y-8">
      <PageHeader title={t("nav.catalog")} description={t("catalog.subtitle")} />
      <CatalogManager isActive={store.is_active} locale={locale} />
    </div>
  );
}
