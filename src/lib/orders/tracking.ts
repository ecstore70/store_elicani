/**
 * Estado PÚBLICO da encomenda — página de seguimento do comprador (B1).
 *
 * Puro: valida a forma que `order_public_status` devolve (defesa em
 * profundidade contra contrato quebrado) e calcula os passos da linha do
 * tempo de estado/entrega. Sem servidor, sem cliente, sem base de dados.
 *
 * Segurança: a autorização é a posse do uuid (capability URL, 122 bits) —
 * por isto NUNCA sai daqui dado do cliente (nome, telefone, morada,
 * notas, pagamento): o RPC devolve só estado, totais e itens, e este
 * módulo só aceita essa forma. URL de outra loja → null → 404.
 */
import { isDeliveryStatus, type DeliveryStatus } from "../delivery/status.ts";
import { isOrderStatus, type OrderStatus } from "./search.ts";

/** Item da encomenda como o comprador o reconhece (sem preço do delta). */
export type OrderTrackingItem = {
  name: string;
  qty: number;
  unitPrice: number;
  options: { groupLabel: string; choiceLabel: string }[];
};

/** Forma segura (camelsCase, tipada) do payload público do RPC. */
export type OrderTracking = {
  reference: string;
  status: OrderStatus;
  deliveryStatus: DeliveryStatus;
  /** ISO-8601 em UTC — validado com Date.parse antes de aceitar. */
  createdAt: string;
  subtotal: number;
  deliveryFee: number | null;
  total: number;
  items: OrderTrackingItem[];
};

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function parseItem(raw: unknown): OrderTrackingItem | null {
  if (typeof raw !== "object" || raw === null) return null;
  const item = raw as Record<string, unknown>;
  if (typeof item.name !== "string" || item.name.length === 0) return null;
  if (
    typeof item.qty !== "number" ||
    !Number.isInteger(item.qty) ||
    item.qty < 1 ||
    item.qty > 99
  ) {
    return null;
  }
  if (!isNonNegativeNumber(item.unit_price)) return null;

  const options: OrderTrackingItem["options"] = [];
  if (!Array.isArray(item.options)) return null;
  for (const rawOption of item.options) {
    if (typeof rawOption !== "object" || rawOption === null) return null;
    const option = rawOption as Record<string, unknown>;
    if (typeof option.groupLabel !== "string") return null;
    if (typeof option.choiceLabel !== "string") return null;
    options.push({
      groupLabel: option.groupLabel,
      choiceLabel: option.choiceLabel,
    });
  }

  return {
    name: item.name,
    qty: item.qty,
    unitPrice: item.unit_price,
    options,
  };
}

/**
 * Aceita SÓ a forma que `order_public_status` emite — qualquer campo em
 * falta/malformado devolve `null` (a página cai no 404 em vez de render
 * dados quebrados). Contrato pequeno de propósito: é a última barreira
 * antes do render.
 */
export function parseOrderTracking(raw: unknown): OrderTracking | null {
  if (typeof raw !== "object" || raw === null) return null;
  const data = raw as Record<string, unknown>;

  if (typeof data.reference !== "string" || data.reference.length === 0) {
    return null;
  }
  if (!isOrderStatus(data.status)) return null;
  if (!isDeliveryStatus(data.delivery_status)) return null;
  if (
    typeof data.created_at !== "string" ||
    Number.isNaN(Date.parse(data.created_at))
  ) {
    return null;
  }
  if (!isNonNegativeNumber(data.subtotal)) return null;
  if (data.delivery_fee !== null && !isNonNegativeNumber(data.delivery_fee)) {
    return null;
  }
  if (!isNonNegativeNumber(data.total)) return null;
  if (!Array.isArray(data.items)) return null;

  const items: OrderTrackingItem[] = [];
  for (const rawItem of data.items) {
    const item = parseItem(rawItem);
    if (!item) return null;
    items.push(item);
  }

  return {
    reference: data.reference,
    status: data.status,
    deliveryStatus: data.delivery_status,
    createdAt: data.created_at,
    subtotal: data.subtotal,
    deliveryFee: data.delivery_fee as number | null,
    total: data.total,
    items,
  };
}

// ── linha do tempo ──────────────────────────────────────────────────────────

/** Fluxo NORMAL — estados fora dele (cancelada, falhada) mostram aviso. */
const ORDER_FLOW = ["pending", "confirmed", "completed"] as const;
const DELIVERY_FLOW = ["pending", "preparing", "on_the_way", "delivered"] as const;

export type StepState = "done" | "current" | "todo";
export type StatusStep = { value: string; state: StepState };

function stepsFor(flow: readonly string[], status: string): StatusStep[] {
  const index = flow.indexOf(status);
  return flow.map((value, i) => ({
    value,
    state: i < index ? "done" : i === index ? "current" : "todo",
  }));
}

/** Passos do estado da encomenda (pending → confirmed → completed). */
export function orderStatusSteps(status: OrderStatus): StatusStep[] {
  return stepsFor(ORDER_FLOW, status);
}

/** Passos da entrega (pending → preparing → on_the_way → delivered). */
export function deliveryStatusSteps(status: DeliveryStatus): StatusStep[] {
  return stepsFor(DELIVERY_FLOW, status);
}

/** Cancelada → a página mostra o aviso, não a linha do tempo. */
export function isOrderInFlow(status: OrderStatus): boolean {
  return (ORDER_FLOW as readonly string[]).includes(status);
}

/** Falhada → a página mostra o aviso, não a linha do tempo. */
export function isDeliveryInFlow(status: DeliveryStatus): boolean {
  return (DELIVERY_FLOW as readonly string[]).includes(status);
}
