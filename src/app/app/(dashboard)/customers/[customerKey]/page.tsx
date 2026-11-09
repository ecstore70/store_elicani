import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CustomerDetail } from "@/components/dashboard/customers/customer-detail";
import { requireUser } from "@/lib/auth/session";
import { getLocale, getTranslator } from "@/lib/i18n/locale";
import { getCustomer } from "@/lib/customers/queries";
import { safeTimeZone } from "@/lib/reports/date-range";
import { requireStore } from "@/lib/stores/queries";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator();
  return { title: t("nav.customers") };
}

/**
 * Detalhe do cliente (`/app/customers/[customerKey]` — chave = telefone
 * normalizado). O cliente é derivado das encomendas da loja ativa:
 * não encontrado → `notFound()` (não existe cliente de outra loja aqui).
 */
export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ customerKey: string }>;
}) {
  const { customerKey } = await params;
  const user = await requireUser();
  const store = await requireStore(user.id);

  const customer = await getCustomer(store.id, customerKey);
  if (!customer) notFound();

  const [t, locale] = await Promise.all([getTranslator(), getLocale()]);

  return (
    <CustomerDetail
      t={t}
      locale={locale}
      currency={store.currency}
      timeZone={safeTimeZone(store.timezone)}
      customer={customer}
    />
  );
}
