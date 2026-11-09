import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { ActionError } from "@/components/dashboard/action-error";
import { updateOrderStatusAction } from "@/lib/orders/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency";
import type { Locale } from "@/lib/i18n/config";
import type { MessageKey } from "@/lib/i18n/messages/en";
import type { Translator } from "@/lib/i18n/translate";
import type { OrderDetailRow } from "@/lib/orders/queries";
import { ORDER_STATUSES } from "@/lib/orders/search";
import { StatusBadge } from "../reports/status-badge";

/**
 * Detalhe da ENCOMENDA — só campos reais da tabela (`orders` +
 * `order_items`); nada de inventar colunas para encher a tela. As
 * mudanças de estado são formulários GET-sem-JS para a server action
 * (loja autorizada na sessão, nunca no input).
 */

const PAYMENT_LABELS: Record<string, MessageKey> = {
  cash: "storefront.paymentCash",
  transfer: "storefront.paymentTransfer",
  other: "storefront.paymentOther",
};

/** Botões de transição: um para cada estado DIFERENTE do atual. */
const NEXT_ACTION_LABELS: Record<string, MessageKey> = {
  pending: "orders.markPending",
  confirmed: "orders.markConfirmed",
  completed: "orders.markCompleted",
  cancelled: "common.cancel",
};

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd
        className={
          strong
            ? "font-semibold tabular-nums"
            : "text-right tabular-nums"
        }
      >
        {value}
      </dd>
    </div>
  );
}

/** Opções gravadas na linha do item (`options` jsonb). */
function optionLines(options: unknown, currency: string, locale: Locale) {
  if (!Array.isArray(options)) return [];
  return options.flatMap((option) => {
    if (!option || typeof option !== "object") return [];
    const record = option as Record<string, unknown>;
    const group =
      typeof record.groupLabel === "string" ? record.groupLabel : "";
    const choice =
      typeof record.choiceLabel === "string" ? record.choiceLabel : "";
    const base = [group, choice].filter(Boolean).join(": ");
    if (!base) return [];
    const delta =
      typeof record.priceDelta === "number" ? record.priceDelta : 0;
    if (delta === 0) return [base];
    const sign = delta > 0 ? "+" : "";
    return [`${base} (${sign}${formatCurrency(delta, currency, locale)})`];
  });
}

export function OrderDetail({
  t,
  locale,
  currency,
  timeZone,
  order,
  showError,
}: {
  t: Translator;
  locale: Locale;
  currency: string;
  timeZone: string;
  order: OrderDetailRow;
  showError: boolean;
}) {
  const dateTimeFormat = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  });

  const paymentKey = order.payment
    ? PAYMENT_LABELS[order.payment]
    : undefined;

  const addressRows: Array<{ label: string; value: string }> = [];
  if (order.customer_address) {
    addressRows.push({
      label: t("storefront.deliveryAddress"),
      value: order.customer_address,
    });
  }
  if (order.customer_neighborhood) {
    addressRows.push({
      label: t("storefront.neighborhood"),
      value: order.customer_neighborhood,
    });
  }
  if (order.customer_reference) {
    addressRows.push({
      label: t("storefront.referencePoint"),
      value: order.customer_reference,
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("orders.number", { reference: order.reference })}
        description={dateTimeFormat.format(new Date(order.created_at))}
      />

      {showError ? <ActionError message={t("common.saveError")} /> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-3 p-4">
              <p className="text-sm font-medium">
                {t("storefront.msgCustomer")}
              </p>
              <dl className="space-y-2">
                <Row label={t("orders.name")} value={order.customer_name} />
                <Row label={t("orders.phone")} value={order.customer_phone} />
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-4">
              <p className="text-sm font-medium">
                {t("storefront.paymentMethod")}
              </p>
              <dl className="space-y-2">
                <Row
                  label={t("storefront.paymentMethod")}
                  value={paymentKey ? t(paymentKey) : "—"}
                />
              </dl>
            </CardContent>
          </Card>

          {addressRows.length > 0 ? (
            <Card>
              <CardContent className="space-y-3 p-4">
                <p className="text-sm font-medium">
                  {t("storefront.deliveryAddress")}
                </p>
                <dl className="space-y-2">
                  {addressRows.map((row) => (
                    <Row key={row.label} label={row.label} value={row.value} />
                  ))}
                </dl>
              </CardContent>
            </Card>
          ) : null}

          {order.customer_notes ? (
            <Card>
              <CardContent className="space-y-3 p-4">
                <p className="text-sm font-medium">
                  {t("storefront.orderNotes")}
                </p>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {order.customer_notes}
                </p>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-3 p-4">
              <p className="text-sm font-medium">
                {t("storefront.msgProducts")}
              </p>
              <ul className="space-y-3">
                {order.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-sm"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="font-medium">
                        {item.name} ×{item.qty}
                      </span>
                      {optionLines(item.options, currency, locale).map(
                        (line) => (
                          <span
                            key={line}
                            className="block text-xs text-muted-foreground"
                          >
                            {line}
                          </span>
                        ),
                      )}
                      <span className="block text-xs text-muted-foreground">
                        {formatCurrency(item.unit_price, currency, locale)}
                      </span>
                    </span>
                    <span className="shrink-0 tabular-nums">
                      {formatCurrency(
                        item.unit_price * item.qty,
                        currency,
                        locale,
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-4">
              <dl className="space-y-2">
                <Row
                  label={t("storefront.subtotal")}
                  value={formatCurrency(order.subtotal, currency, locale)}
                />
                <Row
                  label={t("storefront.delivery")}
                  value={
                    order.delivery_fee !== null
                      ? formatCurrency(order.delivery_fee, currency, locale)
                      : "—"
                  }
                />
                <Row
                  label={t("orders.total")}
                  value={formatCurrency(order.total, currency, locale)}
                  strong
                />
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">{t("orders.status")}</p>
                <StatusBadge status={order.status} t={t} />
              </div>
              <div className="flex flex-wrap gap-2">
                {ORDER_STATUSES.filter((next) => next !== order.status).map(
                  (next) => (
                    <form
                      key={next}
                      action={updateOrderStatusAction}
                      className="flex"
                    >
                      <input
                        type="hidden"
                        name="orderId"
                        value={order.id}
                      />
                      <input type="hidden" name="status" value={next} />
                      <Button
                        type="submit"
                        size="sm"
                        variant={next === "cancelled" ? "destructive" : "outline"}
                      >
                        {t(NEXT_ACTION_LABELS[next])}
                      </Button>
                    </form>
                  ),
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Button asChild size="sm" variant="outline">
        <Link href="/app/orders">
          <ArrowLeft aria-hidden="true" />
          {t("nav.orders")}
        </Link>
      </Button>
    </div>
  );
}
