import type { Metadata } from "next";
import { OrdersView } from "@/components/dashboard/orders/orders-view";
import { requireUser } from "@/lib/auth/session";
import { getLocale, getTranslator } from "@/lib/i18n/locale";
import { listOrders } from "@/lib/orders/queries";
import { isOrderStatus, sanitizeSearchTerm } from "@/lib/orders/search";
import { safeTimeZone } from "@/lib/reports/date-range";
import { requireStore } from "@/lib/stores/queries";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator();
  return { title: t("nav.orders") };
}

/**
 * Lista de ENCOMENDAS com pesquisa (`?q=`) e filtro de estado
 * (`?status=`) resolvidos NO SERVIDOR (PostgREST). A loja vem do dono
 * autenticado; o RLS de SELECT é a autoridade por baixo. Erros de
 * consulta sobem para o error boundary de `/app`.
 */
export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const store = await requireStore(user.id);

  const params = await searchParams;
  const q = sanitizeSearchTerm(params.q);
  const status = isOrderStatus(params.status) ? params.status : null;

  const rows = await listOrders(store.id, { q, status });
  const [t, locale] = await Promise.all([getTranslator(), getLocale()]);

  return (
    <OrdersView
      t={t}
      locale={locale}
      currency={store.currency}
      timeZone={safeTimeZone(store.timezone)}
      rows={rows}
      q={q}
      status={status}
      showError={params.error === "1"}
    />
  );
}
