import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader, PageSection } from "@/components/dashboard/page-header";
import { StatusBadge } from "@/components/dashboard/reports/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency";
import type { Locale } from "@/lib/i18n/config";
import type { Translator } from "@/lib/i18n/translate";
import type { CustomerSummary } from "@/lib/customers/aggregate";

/**
 * Detalhe do CLIENTE — resumo real (encomendas válidas + total gasto) e
 * histórico COMPLETO ligando ao detalhe de encomenda existente
 * (`/app/orders/[id]`): nada de duplicar a interface de encomendas.
 */
export function CustomerDetail({
  t,
  locale,
  currency,
  timeZone,
  customer,
}: {
  t: Translator;
  locale: Locale;
  currency: string;
  timeZone: string;
  customer: CustomerSummary;
}) {
  const dateFormat = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  });

  const summary = [
    {
      label: t("nav.orders"),
      value: new Intl.NumberFormat(locale).format(customer.orderCount),
    },
    {
      label: t("customers.totalSpent"),
      value: formatCurrency(customer.totalSpent, currency, locale),
    },
    {
      label: t("customers.lastOrder"),
      value: customer.lastOrderAt
        ? new Intl.DateTimeFormat(locale, {
            dateStyle: "medium",
            timeZone,
          }).format(new Date(customer.lastOrderAt))
        : "—",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={customer.displayName}
        description={customer.displayPhone}
      />

      <PageSection title={t("customers.summary")}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {summary.map((item) => (
            <Card key={item.label}>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="mt-1 text-base font-semibold tabular-nums">
                  {item.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </PageSection>

      <PageSection title={t("customers.history")}>
        <ul className="divide-y divide-border rounded-lg border border-border bg-card">
          {customer.history.map((order) => (
            <li key={order.id}>
              <Link
                href={`/app/orders/${order.id}`}
                aria-label={t("orders.openDetail", {
                  reference: order.reference,
                })}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 transition-colors hover:bg-muted/50"
              >
                <span className="font-mono text-xs text-muted-foreground">
                  #{order.reference}
                </span>
                <time
                  dateTime={order.createdAt}
                  className="text-xs text-muted-foreground"
                >
                  {dateFormat.format(new Date(order.createdAt))}
                </time>
                <span className="min-w-0 flex-1" aria-hidden="true" />
                <StatusBadge status={order.status} t={t} />
                <span className="shrink-0 text-sm font-medium tabular-nums">
                  {formatCurrency(order.total, currency, locale)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </PageSection>

      <Button asChild size="sm" variant="outline">
        <Link href="/app/customers">
          <ArrowLeft aria-hidden="true" />
          {t("customers.back")}
        </Link>
      </Button>
    </div>
  );
}
