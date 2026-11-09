import "server-only";

import { createClient } from "@/lib/supabase/server";
import { aggregateReport, type ReportData, type ReportItemRow, type ReportOrderRow } from "./aggregate";
import type { ReportRange } from "./date-range";

/**
 * Consultas dos RELATÓRIOS — rodam no servidor, com a sessão do lojista.
 *
 * Duas leituras por período (ambas filtradas por loja + intervalo, e
 * protegidas pelo RLS de dono como segunda camada):
 *   • `orders`      → KPIs, estados, série diária e recentes;
 *   • `order_items` → top produtos e unidades vendidas (junta `!inner` em
 *                     orders para filtrar período/loja já no banco).
 *
 * Só as AGREGAÇÕES atravessam para a página — as linhas brutas ficam aqui
 * (o navegador nunca recebe o histórico inteiro). Limite de segurança para
 * intervalos personalizados muito longos (366 dias no máximo).
 */
const MAX_ORDERS = 5000;
const MAX_ITEMS = 20000;

type OrderRowSelect = {
  id: string;
  status: string;
  total: number;
  created_at: string;
  customer_name: string;
  payment: string | null;
};

type ItemRowSelect = {
  name: string;
  qty: number;
  unit_price: number;
  product_id: string | null;
  orders: { status: string; created_at: string };
};

export async function getReportData(
  storeId: string,
  range: ReportRange,
  timeZone: string,
): Promise<ReportData> {
  const supabase = await createClient();

  const [ordersResult, itemsResult] = await Promise.all([
    supabase
      .from("orders")
      .select("id, status, total, created_at, customer_name, payment")
      .eq("store_id", storeId)
      .gte("created_at", range.from)
      .lt("created_at", range.to)
      .order("created_at", { ascending: false })
      .limit(MAX_ORDERS),
    supabase
      .from("order_items")
      .select(
        "name, qty, unit_price, product_id, orders!inner(status, created_at, store_id)",
      )
      .eq("orders.store_id", storeId)
      .gte("orders.created_at", range.from)
      .lt("orders.created_at", range.to)
      // Mesma transação da inserção → created_at do item acompanha o
      // pedido; ordena por ele para o nome escolhido ser determinístico.
      .order("created_at", { ascending: true })
      .limit(MAX_ITEMS),
  ]);

  if (ordersResult.error) {
    throw new Error(
      `Failed to load orders: ${ordersResult.error.message}`,
    );
  }
  if (itemsResult.error) {
    throw new Error(
      `Failed to load order items: ${itemsResult.error.message}`,
    );
  }

  const orders: ReportOrderRow[] = (ordersResult.data ?? []).map(
    (row: OrderRowSelect) => ({
      id: row.id,
      status: row.status,
      total: Number(row.total),
      createdAt: row.created_at,
      customerName: row.customer_name,
      payment: row.payment,
    }),
  );

  const items: ReportItemRow[] = (itemsResult.data ?? []).map(
    (row: ItemRowSelect) => ({
      name: row.name,
      qty: row.qty,
      unitPrice: Number(row.unit_price),
      productId: row.product_id,
      orderStatus: row.orders.status,
      orderCreatedAt: row.orders.created_at,
    }),
  );

  return aggregateReport({
    orders,
    items,
    fromKey: range.fromKey,
    days: range.days,
    timeZone,
  });
}
