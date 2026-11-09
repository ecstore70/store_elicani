import { Badge } from "@/components/ui/badge";
import { STATUS_KEYS, type StatusKey } from "@/lib/reports/aggregate";
import type { MessageKey } from "@/lib/i18n/messages/en";
import type { Translator } from "@/lib/i18n/translate";

/** Rótulo i18n de cada estado — os nomes NUNCA vêm fixos no código. */
export const STATUS_LABELS: Record<StatusKey, MessageKey> = {
  pending: "status.pending",
  confirmed: "status.confirmed",
  completed: "status.completed",
  cancelled: "status.cancelled",
};

/** Variante visual do badge — só variantes existentes do design system. */
const STATUS_VARIANTS: Record<
  StatusKey,
  "secondary" | "default" | "outline" | "destructive"
> = {
  pending: "secondary",
  confirmed: "default",
  completed: "outline",
  cancelled: "destructive",
};

export function isStatusKey(value: string): value is StatusKey {
  return (STATUS_KEYS as readonly string[]).includes(value);
}

/** Badge de estado de um pedido (lista recente + resumo). */
export function StatusBadge({
  status,
  t,
}: {
  status: string;
  t: Translator;
}) {
  const key: StatusKey = isStatusKey(status) ? status : "pending";
  return (
    <Badge variant={STATUS_VARIANTS[key]}>{t(STATUS_LABELS[key])}</Badge>
  );
}
