import { ShoppingCart } from "lucide-react";
import { PageHeader, PageSection } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatNumber } from "@/lib/currency";
import type { Locale } from "@/lib/i18n/config";
import type { Translator } from "@/lib/i18n/translate";
import { STATUS_KEYS, type ReportData } from "@/lib/reports/aggregate";
import type { ReportRange } from "@/lib/reports/date-range";
import { OrdersChart, SalesChart } from "./charts";
import { RangeSelector } from "./range-selector";
import { RecentOrders } from "./recent-orders";
import { StatusBadge } from "./status-badge";
import { TopProducts } from "./top-products";

/**
 * Dashboard de RELATÓRIOS — composição de dados reais (KPIs, gráficos,
 * top produtos, estados, recentes). Tudo server-rendered: os gráficos são
 * SVG estáticos e o seletor de período são links/formulário GET.
 *
 * Sem pedidos no período → estado vazio dedicado (nunca "0, 0, 0" sem
 * explicação). Layout mobile-first: KPIs em 2 colunas, listas como linhas
 * flexíveis, nada de tabelas largas.
 */
export function ReportsView({
  t,
  locale,
  currency,
  timeZone,
  range,
  todayKey,
  data,
}: {
  t: Translator;
  locale: Locale;
  currency: string;
  timeZone: string;
  range: ReportRange;
  todayKey: string;
  data: ReportData;
}) {
  const kpis = [
    {
      label: t("reports.kpiSales"),
      value: formatCurrency(data.kpis.sales, currency, locale),
    },
    {
      label: t("reports.kpiOrders"),
      value: formatNumber(data.kpis.orderCount, locale),
    },
    {
      label: t("reports.kpiAvgOrder"),
      value: formatCurrency(data.kpis.avgOrder, currency, locale),
    },
    {
      label: t("reports.kpiItemsSold"),
      value: formatNumber(data.kpis.itemsSold, locale),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("nav.reports")}
        description={t("reports.subtitle")}
      />
      <RangeSelector t={t} range={range} todayKey={todayKey} />

      {data.empty ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <span className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <ShoppingCart aria-hidden="true" className="size-5" />
            </span>
            <p className="text-sm font-medium">{t("reports.empty")}</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              {t("reports.emptyHint")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {kpis.map((kpi) => (
              <Card key={kpi.label}>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <p className="mt-1 text-base font-semibold tabular-nums sm:text-lg">
                    {kpi.value}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <PageSection title={t("reports.chartSales")}>
            <Card>
              <CardContent className="p-4">
                <SalesChart
                  series={data.series}
                  locale={locale}
                  currency={currency}
                />
              </CardContent>
            </Card>
          </PageSection>

          <PageSection title={t("reports.chartOrders")}>
            <Card>
              <CardContent className="p-4">
                <OrdersChart series={data.series} locale={locale} />
              </CardContent>
            </Card>
          </PageSection>

          <div className="grid gap-6 lg:grid-cols-2">
            <PageSection title={t("reports.topProducts")}>
              <TopProducts
                products={data.topProducts}
                t={t}
                locale={locale}
                currency={currency}
              />
            </PageSection>

            <PageSection title={t("nav.orders")}>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
                {STATUS_KEYS.map((key) => (
                  <Card key={key}>
                    <CardContent className="space-y-2 p-4">
                      <StatusBadge status={key} t={t} />
                      <p className="text-xl font-semibold tabular-nums">
                        {formatNumber(data.statuses[key], locale)}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </PageSection>
          </div>

          <PageSection title={t("reports.recentOrders")}>
            <RecentOrders
              orders={data.recent}
              t={t}
              locale={locale}
              currency={currency}
              timeZone={timeZone}
            />
          </PageSection>
        </div>
      )}
    </div>
  );
}
