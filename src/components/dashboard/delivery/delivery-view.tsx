import Link from "next/link";
import { Truck } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { ActionError } from "@/components/dashboard/action-error";
import { updateDeliveryStatusAction } from "@/lib/delivery/actions";
import type { DeliveryRow } from "@/lib/delivery/queries";
import {
  DELIVERY_STATUSES,
  isDeliveryStatus,
  type DeliveryStatus,
} from "@/lib/delivery/status";
import { StatusBadge } from "@/components/dashboard/reports/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatNumber } from "@/lib/currency";
import type { Locale } from "@/lib/i18n/config";
import type { MessageKey } from "@/lib/i18n/messages/en";
import type { Translator } from "@/lib/i18n/translate";

/**
 * Módulo ENTREGA — visibilidade operacional: contagens por estado de
 * entrega, filtros e lista com morada/taxa/estados + botões para
 * avançar o estado de entrega (form sem JS → server action). Encomendas
 * canceladas ficam de fora (nada a entregar). Não há GPS/motoristas/
 * rotas — só a fundação útil.
 */

const DELIVERY_LABELS: Record<DeliveryStatus, MessageKey> = {
  pending: "delivery.statusPending",
  preparing: "delivery.statusPreparing",
  on_the_way: "delivery.statusOnTheWay",
  delivered: "delivery.statusDelivered",
};

/** Variantes do design system — distintas das de estado de encomenda. */
const DELIVERY_VARIANTS: Record<
  DeliveryStatus,
  "secondary" | "outline" | "default" | "ghost"
> = {
  pending: "secondary",
  preparing: "outline",
  on_the_way: "default",
  delivered: "ghost",
};

/** Rótulo do botão para ESTADO DE DESTINO (≠ estado atual da linha). */
const DELIVERY_ACTIONS: Record<DeliveryStatus, MessageKey> = {
  pending: "orders.markPending",
  preparing: "delivery.markPreparing",
  on_the_way: "delivery.markOnTheWay",
  delivered: "delivery.markDelivered",
};

function DeliveryBadge({
  status,
  t,
}: {
  status: DeliveryStatus;
  t: Translator;
}) {
  return (
    <Badge variant={DELIVERY_VARIANTS[status]}>
      {t(DELIVERY_LABELS[status])}
    </Badge>
  );
}

export function DeliveryView({
  t,
  locale,
  currency,
  timeZone,
  counts,
  rows,
  status,
  showError,
}: {
  t: Translator;
  locale: Locale;
  currency: string;
  timeZone: string;
  counts: Record<DeliveryStatus, number>;
  rows: readonly DeliveryRow[];
  status: DeliveryStatus | null;
  showError: boolean;
}) {
  const dateFormat = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeZone,
  });

  const hrefFor = (next: DeliveryStatus | "all"): string =>
    next === "all"
      ? "/app/delivery"
      : `/app/delivery?status=${encodeURIComponent(next)}`;

  const chips: Array<DeliveryStatus | "all"> = ["all", ...DELIVERY_STATUSES];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("nav.delivery")}
        description={t("delivery.subtitle")}
      />

      {showError ? <ActionError message={t("common.saveError")} /> : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {DELIVERY_STATUSES.map((key) => (
          <Card key={key}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">
                {t(DELIVERY_LABELS[key])}
              </p>
              <p className="mt-1 text-base font-semibold tabular-nums sm:text-lg">
                {formatNumber(counts[key], locale)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <nav aria-label={t("delivery.changeStatus")} className="flex flex-wrap gap-2">
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
                ? t("delivery.filterAll")
                : t(DELIVERY_LABELS[chip])}
            </Link>
          </Button>
        ))}
      </nav>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <span className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Truck aria-hidden="true" className="size-5" />
            </span>
            <p className="text-sm font-medium">{t("delivery.empty")}</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              {t("delivery.emptyBody")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => {
            const fee = row.delivery_fee;
            const phoneDigits = row.customer_phone.replace(/[^\d+]/g, "");
            return (
              <li
                key={row.id}
                className="rounded-lg border border-border bg-card p-4"
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <Link
                    href={`/app/orders/${row.id}`}
                    aria-label={t("orders.openDetail", {
                      reference: row.reference,
                    })}
                    className="font-mono text-xs text-muted-foreground underline-offset-2 hover:underline"
                  >
                    #{row.reference}
                  </Link>
                  <span className="text-sm font-medium">
                    {row.customer_name}
                  </span>
                  {phoneDigits ? (
                    <a
                      href={`tel:${phoneDigits}`}
                      className="text-xs text-muted-foreground"
                    >
                      {row.customer_phone}
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {row.customer_phone}
                    </span>
                  )}
                  <time
                    dateTime={row.created_at}
                    className="text-xs text-muted-foreground"
                  >
                    {dateFormat.format(new Date(row.created_at))}
                  </time>
                </div>

                <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  {row.customer_neighborhood ? (
                    <span className="font-medium text-foreground">
                      {row.customer_neighborhood}
                    </span>
                  ) : null}
                  {row.customer_address ? (
                    <span className="min-w-0 break-words">
                      {row.customer_address}
                    </span>
                  ) : null}
                  <span>
                    {t("delivery.fee")}:{" "}
                    <span className="tabular-nums">
                      {fee !== null
                        ? formatCurrency(fee, currency, locale)
                        : "—"}
                    </span>
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                  <span className="text-muted-foreground">
                    {t("delivery.labelDelivery")}:
                  </span>
                  <DeliveryBadge
                    status={
                      isDeliveryStatus(row.delivery_status)
                        ? row.delivery_status
                        : "pending"
                    }
                    t={t}
                  />
                  <span className="text-muted-foreground">
                    {t("delivery.labelOrder")}:
                  </span>
                  <StatusBadge status={row.status} t={t} />
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {DELIVERY_STATUSES.filter(
                    (next) => next !== row.delivery_status,
                  ).map((next) => (
                    <form
                      key={next}
                      action={updateDeliveryStatusAction}
                      className="flex"
                    >
                      <input
                        type="hidden"
                        name="orderId"
                        value={row.id}
                      />
                      <input
                        type="hidden"
                        name="deliveryStatus"
                        value={next}
                      />
                      <Button type="submit" size="sm" variant="outline">
                        {t(DELIVERY_ACTIONS[next])}
                      </Button>
                    </form>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
