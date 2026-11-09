import type { Metadata } from "next";
import { DeliveryView } from "@/components/dashboard/delivery/delivery-view";
import { requireUser } from "@/lib/auth/session";
import { getLocale, getTranslator } from "@/lib/i18n/locale";
import { getDeliveryData } from "@/lib/delivery/queries";
import { isDeliveryStatus } from "@/lib/delivery/status";
import { safeTimeZone } from "@/lib/reports/date-range";
import { requireStore } from "@/lib/stores/queries";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator();
  return { title: t("nav.delivery") };
}

/**
 * Módulo ENTREGA — uma consulta leve à tabela `orders` da loja (RLS do
 * dono), contagens e filtro de estado calculados no servidor. Canceladas
 * ficam de fora; nada de GPS/rotas/frota nesta versão.
 */
export default async function DeliveryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const store = await requireStore(user.id);

  const params = await searchParams;
  const status = isDeliveryStatus(params.status) ? params.status : null;

  const { counts, visible } = await getDeliveryData(store.id, { status });
  const [t, locale] = await Promise.all([getTranslator(), getLocale()]);

  return (
    <DeliveryView
      t={t}
      locale={locale}
      currency={store.currency}
      timeZone={safeTimeZone(store.timezone)}
      counts={counts}
      rows={visible}
      status={status}
      showError={params.error === "1"}
    />
  );
}
