import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OrderDetail } from "@/components/dashboard/orders/order-detail";
import { requireUser } from "@/lib/auth/session";
import { getLocale, getTranslator } from "@/lib/i18n/locale";
import { getOrderDetail } from "@/lib/orders/queries";
import { safeTimeZone } from "@/lib/reports/date-range";
import { requireStore } from "@/lib/stores/queries";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator();
  return { title: t("nav.orders") };
}

/**
 * Detalhe de uma encomenda (`/app/orders/[orderId]`).
 * Loja da sessão + `eq("store_id")` + RLS: encomenda de outra loja →
 * `notFound()` (mesma resposta de "não existe" — sem vazar existência).
 */
export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ orderId }, sp] = await Promise.all([params, searchParams]);
  const user = await requireUser();
  const store = await requireStore(user.id);

  const order = await getOrderDetail(store.id, orderId);
  if (!order) notFound();

  const [t, locale] = await Promise.all([getTranslator(), getLocale()]);

  return (
    <OrderDetail
      t={t}
      locale={locale}
      currency={store.currency}
      timeZone={safeTimeZone(store.timezone)}
      order={order}
      showError={sp.error === "1"}
    />
  );
}
