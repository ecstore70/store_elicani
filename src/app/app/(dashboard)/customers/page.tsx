import type { Metadata } from "next";
import { CustomersView } from "@/components/dashboard/customers/customers-view";
import { requireUser } from "@/lib/auth/session";
import { getLocale, getTranslator } from "@/lib/i18n/locale";
import { getCustomers } from "@/lib/customers/queries";
import { safeTimeZone } from "@/lib/reports/date-range";
import { requireStore } from "@/lib/stores/queries";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator();
  return { title: t("nav.customers") };
}

/**
 * Lista de CLIENTES — agregada das encomendas da loja no servidor
 * (uma consulta leve + `summarizeCustomers`). Sem tabela de clientes:
 * o dado é o que já existe em `orders`, com RLS do dono por baixo.
 */
export default async function CustomersPage() {
  const user = await requireUser();
  const store = await requireStore(user.id);

  const customers = await getCustomers(store.id);
  const [t, locale] = await Promise.all([getTranslator(), getLocale()]);

  return (
    <CustomersView
      t={t}
      locale={locale}
      currency={store.currency}
      timeZone={safeTimeZone(store.timezone)}
      customers={customers}
    />
  );
}
