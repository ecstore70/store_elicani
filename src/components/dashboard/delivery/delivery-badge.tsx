import { Badge } from "@/components/ui/badge";
import type { DeliveryStatus } from "@/lib/delivery/status";
import type { MessageKey } from "@/lib/i18n/messages/en";
import type { Translator } from "@/lib/i18n/translate";

/** Rótulo i18n de cada estado de entrega — nunca rótulos fixos no código. */
export const DELIVERY_LABELS: Record<DeliveryStatus, MessageKey> = {
  pending: "delivery.statusPending",
  preparing: "delivery.statusPreparing",
  on_the_way: "delivery.statusOnTheWay",
  delivered: "delivery.statusDelivered",
  failed: "delivery.statusFailed",
};

/** Variantes do design system — distintas das de estado de encomenda. */
export const DELIVERY_VARIANTS: Record<
  DeliveryStatus,
  "secondary" | "outline" | "default" | "ghost" | "destructive"
> = {
  pending: "secondary",
  preparing: "outline",
  on_the_way: "default",
  delivered: "ghost",
  failed: "destructive",
};

/** Badge de estado de ENTREGA — partilhado pela lista Encomendas e Entrega. */
export function DeliveryBadge({
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
