/**
 * Estado de ENTREGA — PURO e separado do estado da encomenda
 * (`status`): não corrompe o modelo existente, só acrescenta a coluna
 * `delivery_status` (pendente → em preparação → a caminho → entregue).
 * Nomenclatura do módulo Entrega do painel.
 */
export const DELIVERY_STATUSES = [
  "pending",
  "preparing",
  "on_the_way",
  "delivered",
] as const;

export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

export function isDeliveryStatus(value: unknown): value is DeliveryStatus {
  return (
    typeof value === "string" &&
    (DELIVERY_STATUSES as readonly string[]).includes(value)
  );
}

export type DeliveryCountRow = { delivery_status: string };

/** Contagem por estado para os cartões do topo (todas as entradas). */
export function countByDeliveryStatus(
  rows: readonly DeliveryCountRow[],
): Record<DeliveryStatus, number> {
  const counts: Record<DeliveryStatus, number> = {
    pending: 0,
    preparing: 0,
    on_the_way: 0,
    delivered: 0,
  };
  for (const row of rows) {
    if (isDeliveryStatus(row.delivery_status)) {
      counts[row.delivery_status] += 1;
    }
  }
  return counts;
}
