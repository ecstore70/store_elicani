/**
 * Agregação dos RELATÓRIOS — PURA e testável.
 *
 * Recebe as linhas já filtradas pelo período (uma consulta por loja +
 * intervalo, feita em `queries.ts`) e devolve os números apresentados:
 * KPIs, série diária, estados, top produtos e recentes. Nenhum valor é
 * inventado: tudo é soma/contagem determinística sobre as linhas dadas.
 *
 * Regra de venda VÁLIDA: whitelist `pending | confirmed | completed` — a
 * Fase 1 não tinha estados; `pending` (estado inicial de toda encomenda)
 * conta como venda porque num fluxo WhatsApp a encomenda é real até o
 * comerciante a cancelar. Estado desconhecido NÃO conta (seguro para
 * futuros estados); `cancelled` fica de fora por definição.
 *
 * Séries e datas: as chaves de dia são LOCAIS ao fuso da loja (a mesma
 * regra com que `date-range.ts` constrói os limites).
 */
import { addDays, dateKeyOf } from "./date-range.ts";

export type StatusKey = "pending" | "confirmed" | "completed" | "cancelled";
export const STATUS_KEYS = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
] as const satisfies readonly StatusKey[];

/** Estados que contam como VENDA (branco — segura para estados futuros). */
const VALID_SALE_STATUSES: ReadonlySet<string> = new Set([
  "pending",
  "confirmed",
  "completed",
]);

/** Venda válida: whitelist acima (cancelado e estados desconhecidos ficam fora). */
export function isValidSale(status: string): boolean {
  return VALID_SALE_STATUSES.has(status);
}

export type ReportOrderRow = {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  customerName: string;
  payment: string | null;
};

export type ReportItemRow = {
  name: string;
  qty: number;
  unitPrice: number;
  productId: string | null;
  /** Estado do pedido dono da linha (junta em `queries.ts`). */
  orderStatus: string;
  /** Data do pedido dono — ordena a escolha determinística do nome. */
  orderCreatedAt: string;
};

export type StatusCounts = Record<StatusKey, number>;

export type TopProduct = {
  key: string;
  name: string;
  qty: number;
  revenue: number;
  /** Fração das vendas (0..1), arredondada a 4 casas. */
  share: number;
};

export type SalesPoint = { dateKey: string; sales: number; orders: number };

export type ReportData = {
  /** Nenhum pedido no período (nem cancelado) → estado vazio dedicado. */
  empty: boolean;
  kpis: {
    sales: number;
    orderCount: number;
    avgOrder: number;
    itemsSold: number;
  };
  series: SalesPoint[];
  statuses: StatusCounts;
  topProducts: TopProduct[];
  recent: ReportOrderRow[];
};

export type AggregateInput = {
  orders: readonly ReportOrderRow[];
  items: readonly ReportItemRow[];
  /** Período (chave inicial + dias) — mesmo contrato de `date-range.ts`. */
  fromKey: string;
  days: number;
  /** Fuso da loja (já normalizado por `safeTimeZone`). */
  timeZone: string;
  topLimit?: number;
  recentLimit?: number;
};

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function round4(value: number): number {
  return Math.round(value * 10000) / 10000;
}

/**
 * Agrega as linhas do período. `orders` chega ordenado por data desc;
 * `items` por data do pedido asc (garantido pelas consultas — aqui também
 * se ordena de forma defensiva para os resultados serem determinísticos).
 */
export function aggregateReport(input: AggregateInput): ReportData {
  const {
    orders,
    items,
    fromKey,
    days,
    timeZone,
    topLimit = 10,
    recentLimit = 8,
  } = input;

  const validOrders = orders.filter((order) => isValidSale(order.status));

  // ── KPIs ────────────────────────────────────────────────────────────────
  const sales = validOrders.reduce((total, order) => total + order.total, 0);
  const orderCount = validOrders.length;
  const avgOrder = orderCount > 0 ? round2(sales / orderCount) : 0;

  const itemsSold = items
    .filter((item) => isValidSale(item.orderStatus))
    .reduce((total, item) => total + item.qty, 0);

  // ── estados (todos os pedidos do período, válidos ou não) ───────────────
  const statuses: StatusCounts = {
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
  };
  for (const order of orders) {
    if (order.status in statuses) {
      statuses[order.status as StatusKey] += 1;
    }
  }

  // ── série diária (dias LOCAIS da loja, zeros incluídos) ─────────────────
  const series: SalesPoint[] = [];
  const indexByKey = new Map<string, number>();
  for (let day = 0; day < days; day += 1) {
    const dateKey = addDays(fromKey, day);
    indexByKey.set(dateKey, series.length);
    series.push({ dateKey, sales: 0, orders: 0 });
  }
  for (const order of validOrders) {
    const index = indexByKey.get(
      dateKeyOf(new Date(order.createdAt).getTime(), timeZone),
    );
    if (index === undefined) continue; // fora do período (defensivo)
    series[index].sales += order.total;
    series[index].orders += 1;
  }
  for (const point of series) point.sales = round2(point.sales);

  // ── top produtos (só vendas válidas; melhor vendidos = unidades) ────────
  const groups = new Map<
    string,
    { name: string; qty: number; revenue: number }
  >();
  const validItems = items.filter((item) => isValidSale(item.orderStatus));
  for (const item of validItems) {
    // Produto apagado/renomeado não fragmenta o ranking: agrupa por id
    // quando existe (nome = primeiro da ordem cronológica) e por nome
    // quando não existe.
    const key = item.productId ? `p:${item.productId}` : `n:${item.name}`;
    const group = groups.get(key);
    if (group) {
      group.qty += item.qty;
      group.revenue += item.qty * item.unitPrice;
    } else {
      groups.set(key, {
        name: item.name,
        qty: item.qty,
        revenue: item.qty * item.unitPrice,
      });
    }
  }
  const topProducts: TopProduct[] = [...groups.entries()]
    .map(([key, group]) => ({
      key,
      name: group.name,
      qty: group.qty,
      revenue: round2(group.revenue),
      share: sales > 0 ? round4(group.revenue / sales) : 0,
    }))
    .sort(
      (a, b) =>
        b.qty - a.qty ||
        b.revenue - a.revenue ||
        a.name.localeCompare(b.name),
    )
    .slice(0, topLimit);

  // ── recentes (válidos, mais primeiro) ───────────────────────────────────
  const recent = [...validOrders]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, recentLimit);

  return {
    empty: orders.length === 0,
    kpis: { sales: round2(sales), orderCount, avgOrder, itemsSold },
    series,
    statuses,
    topProducts,
    recent,
  };
}
