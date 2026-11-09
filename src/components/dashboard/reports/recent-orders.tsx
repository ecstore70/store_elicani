import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/currency";
import type { Locale } from "@/lib/i18n/config";
import type { ReportOrderRow } from "@/lib/reports/aggregate";
import type { Translator } from "@/lib/i18n/translate";
import { StatusBadge } from "./status-badge";

/**
 * Pedidos recentes do período (válidos, mais primeiro) — RESUMO, não a
 * interface de Pedidos: cada linha liga para `/app/orders` (a secção de
 * pedidos da Fase 1) em vez de duplicar gestão de estados aqui.
 *
 * Referência derivada do id (sem coluna extra): `#A3F9C2`.
 */
export function RecentOrders({
  orders,
  t,
  locale,
  currency,
  timeZone,
}: {
  orders: readonly ReportOrderRow[];
  t: Translator;
  locale: Locale;
  currency: string;
  timeZone: string;
}) {
  const dateFormat = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  });

  return (
    <div className="space-y-3">
      <ul className="divide-y divide-border rounded-lg border border-border bg-card">
        {orders.map((order) => (
          <li key={order.id}>
            <Link
              href="/app/orders"
              className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 transition-colors hover:bg-muted/50"
            >
              <span className="font-mono text-xs text-muted-foreground">
                #{order.id.slice(0, 6).toUpperCase()}
              </span>
              <time
                dateTime={order.createdAt}
                className="text-xs text-muted-foreground"
              >
                {dateFormat.format(new Date(order.createdAt))}
              </time>
              <span className="min-w-0 flex-1 truncate text-sm">
                {order.customerName}
              </span>
              <StatusBadge status={order.status} t={t} />
              <span className="shrink-0 text-sm font-medium tabular-nums">
                {formatCurrency(order.total, currency, locale)}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <Button asChild size="sm" variant="outline">
        <Link href="/app/orders">{t("reports.viewAllOrders")}</Link>
      </Button>
    </div>
  );
}
