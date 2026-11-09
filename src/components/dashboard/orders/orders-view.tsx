import Link from "next/link";
import { Search, ShoppingCart } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { ActionError } from "@/components/dashboard/action-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency";
import type { Locale } from "@/lib/i18n/config";
import type { MessageKey } from "@/lib/i18n/messages/en";
import type { Translator } from "@/lib/i18n/translate";
import type { OrderListRow } from "@/lib/orders/queries";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/orders/search";
import { STATUS_LABELS, StatusBadge } from "../reports/status-badge";

/**
 * Lista de ENCOMENDAS — pesquisa (`?q=`) e filtros de estado
 * (`?status=`) são formulário GET e links; o servidor já filtrou no
 * banco (nada de filtrar a tabela no navegador). Cada linha abre o
 * detalhe. Mobile-first: linhas flexíveis que quebram, sem tabela larga.
 */

const PAYMENT_LABELS: Record<string, MessageKey> = {
  cash: "storefront.paymentCash",
  transfer: "storefront.paymentTransfer",
  other: "storefront.paymentOther",
};

type ChipKey = OrderStatus | "all";

export function OrdersView({
  t,
  locale,
  currency,
  timeZone,
  rows,
  q,
  status,
  showError,
}: {
  t: Translator;
  locale: Locale;
  currency: string;
  timeZone: string;
  rows: readonly OrderListRow[];
  q: string;
  status: OrderStatus | null;
  showError: boolean;
}) {
  const dateFormat = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  });
  const hasFilter = q.length > 0 || status !== null;

  const hrefFor = (next: ChipKey): string => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (next !== "all") params.set("status", next);
    const query = params.toString();
    return query ? `/app/orders?${query}` : "/app/orders";
  };

  const chips: ChipKey[] = ["all", ...ORDER_STATUSES];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("nav.orders")}
        description={t("orders.subtitle")}
      />

      {showError ? <ActionError message={t("common.saveError")} /> : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form
          method="get"
          action="/app/orders"
          className="flex flex-wrap items-center gap-2"
        >
          <label htmlFor="orders-q" className="sr-only">
            {t("orders.searchPlaceholder")}
          </label>
          <Input
            id="orders-q"
            name="q"
            defaultValue={q}
            placeholder={t("orders.searchPlaceholder")}
            className="h-9 w-full sm:w-56"
          />
          {status ? (
            <input type="hidden" name="status" value={status} />
          ) : null}
          <Button type="submit" size="sm" variant="outline">
            <Search aria-hidden="true" />
            {t("orders.search")}
          </Button>
        </form>

        <nav
          aria-label={t("orders.status")}
          className="flex flex-wrap gap-2"
        >
          {chips.map((chip) => (
            <Button
              key={chip}
              asChild
              size="sm"
              variant={
                (chip === "all" && status === null) || chip === status
                  ? "default"
                  : "outline"
              }
            >
              <Link href={hrefFor(chip)}>
                {chip === "all"
                  ? t("orders.filterAll")
                  : t(STATUS_LABELS[chip])}
              </Link>
            </Button>
          ))}
        </nav>
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            {hasFilter ? (
              <p className="text-sm font-medium">{t("orders.noResults")}</p>
            ) : (
              <>
                <span className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <ShoppingCart aria-hidden="true" className="size-5" />
                </span>
                <p className="text-sm font-medium">{t("orders.emptyTitle")}</p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  {t("orders.emptyBody")}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-card">
          {rows.map((order) => {
            const paymentKey = order.payment
              ? PAYMENT_LABELS[order.payment]
              : undefined;
            return (
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
                  <StatusBadge status={order.status} t={t} />
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {order.customer_name}
                  </span>
                  <time
                    dateTime={order.created_at}
                    className="text-xs text-muted-foreground"
                  >
                    {dateFormat.format(new Date(order.created_at))}
                  </time>
                  {paymentKey ? (
                    <span className="text-xs text-muted-foreground">
                      {t(paymentKey)}
                    </span>
                  ) : null}
                  {order.delivery_fee !== null ? (
                    <span className="text-xs text-muted-foreground">
                      {t("storefront.delivery")}{" "}
                      {formatCurrency(order.delivery_fee, currency, locale)}
                    </span>
                  ) : null}
                  <span className="shrink-0 text-sm font-medium tabular-nums">
                    {formatCurrency(order.total, currency, locale)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
