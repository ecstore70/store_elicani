import type { Metadata } from "next";
import { ReportsView } from "@/components/dashboard/reports/reports-view";
import { requireUser } from "@/lib/auth/session";
import { getLocale, getTranslator } from "@/lib/i18n/locale";
import {
  dateKeyOf,
  resolveRange,
  safeTimeZone,
  type RangeParams,
} from "@/lib/reports/date-range";
import { getReportData } from "@/lib/reports/queries";
import { requireStore } from "@/lib/stores/queries";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator();
  return { title: t("nav.reports") };
}

/**
 * Relatórios do período selecionado (`?range=…` ou `?from=…&to=…`).
 *
 * A loja vem do dono autenticado (layout + defesa nesta camada) e o fuso
 * é o configurado na loja (`stores.timezone`) — os limites e as séries
 * diária são LOCAIS à loja, nunca datas fixas. Erros de consulta sobem
 * para o error boundary de `/app` (estado de erro + tentar de novo).
 */
export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const store = await requireStore(user.id);

  const params: RangeParams = await searchParams;
  const timeZone = safeTimeZone(store.timezone);
  const now = new Date();
  const range = resolveRange(params, now, timeZone);
  const data = await getReportData(store.id, range, timeZone);
  const [t, locale] = await Promise.all([getTranslator(), getLocale()]);

  return (
    <ReportsView
      t={t}
      locale={locale}
      currency={store.currency}
      timeZone={timeZone}
      range={range}
      todayKey={dateKeyOf(now.getTime(), timeZone)}
      data={data}
    />
  );
}
