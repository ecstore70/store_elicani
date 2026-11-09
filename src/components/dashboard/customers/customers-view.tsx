import Link from "next/link";
import { ChevronRight, Users } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency";
import type { Locale } from "@/lib/i18n/config";
import type { Translator } from "@/lib/i18n/translate";
import type { CustomerSummary } from "@/lib/customers/aggregate";

/**
 * Lista de CLIENTES — derivada das encomendas reais (sem tabela nova).
 * Cada linha liga para o detalhe do cliente (`/app/customers/[key]`).
 * Mobile-first: linhas empilhadas com contagem, total e última data.
 */
export function CustomersView({
  t,
  locale,
  currency,
  timeZone,
  customers,
}: {
  t: Translator;
  locale: Locale;
  currency: string;
  timeZone: string;
  customers: readonly CustomerSummary[];
}) {
  const dateFormat = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeZone,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("nav.customers")}
        description={t("customers.subtitle")}
      />

      {customers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <span className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Users aria-hidden="true" className="size-5" />
            </span>
            <p className="text-sm font-medium">{t("customers.emptyTitle")}</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              {t("customers.emptyBody")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-card">
          {customers.map((customer) => (
            <li key={customer.key}>
              <Link
                href={`/app/customers/${encodeURIComponent(customer.key)}`}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
              >
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-baseline gap-x-2">
                    <span className="truncate text-sm font-medium">
                      {customer.displayName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {customer.displayPhone}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {t("nav.orders")}:{" "}
                    <span className="tabular-nums">{customer.orderCount}</span>
                    {" · "}
                    {t("customers.totalSpent")}:{" "}
                    <span className="tabular-nums">
                      {formatCurrency(customer.totalSpent, currency, locale)}
                    </span>
                  </span>
                  {customer.lastOrderAt ? (
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {t("customers.lastOrder")}:{" "}
                      {dateFormat.format(new Date(customer.lastOrderAt))}
                    </span>
                  ) : null}
                </span>
                <ChevronRight
                  aria-hidden="true"
                  className="size-4 shrink-0 text-muted-foreground"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
