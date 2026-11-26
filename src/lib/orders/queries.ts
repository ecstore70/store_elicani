import { createPublicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import { isOrderStatus, isUuid, sanitizeSearchTerm } from "./search";
import type { OrderStatus } from "./search";
import { parseOrderTracking, type OrderTracking } from "./tracking";

/**
 * Leituras do módulo ENCOMENDAS (painel).
 *
 * Tudo aqui corre no servidor com a sessão do DONO: o RLS de SELECT
 * (linha = loja própria) é a autoridade; a loja ativa é reforçada com
 * `eq("store_id", …)` para nunca sequer pedir linhas de outra loja.
 * Nada disto chega ao navegador sem passar pelas páginas RSC.
 *
 * Única exceção pública: `getOrderTracking` (página de seguimento do
 * comprador) — capability URL por uuid, via RPC SECURITY DEFINER que
 * devolve só estado/totais/itens, nunca PII do cliente.
 */

/** Linha leve da LISTA — só o que a lista mostra. */
export type OrderListRow = {
  id: string;
  reference: string;
  status: string;
  delivery_status: string;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  payment: string | null;
  total: number;
  delivery_fee: number | null;
  /** N.º de itens da encomenda (contagem embutida, nunca linha crua). */
  item_count: number;
};

/** Encomenda completa do DETALHE (campos reais da tabela + itens). */
export type OrderDetailRow = OrderListRow & {
  customer_address: string | null;
  customer_neighborhood: string | null;
  customer_reference: string | null;
  customer_notes: string | null;
  subtotal: number;
  updated_at: string;
  items: OrderItemRow[];
};

export type OrderItemRow = {
  id: string;
  product_id: string | null;
  name: string;
  qty: number;
  unit_price: number;
  options: unknown;
};

const LIST_COLUMNS =
  "id, reference, status, delivery_status, created_at, customer_name, " +
  "customer_phone, payment, total, delivery_fee, " +
  // contagem de itens embutida — a lista nunca recebe linhas de order_items
  "item_count:order_items(count)";

/**
 * Contagem embutida do PostgREST chega como `[{ count }]` (agregado de uma
 * para-muitos); parser defensivo para também aceitar objeto direto.
 */
function parseEmbeddedCount(raw: unknown): number {
  const countOf = (value: unknown): number =>
    value !== null &&
    typeof value === "object" &&
    typeof (value as { count?: unknown }).count === "number"
      ? (value as { count: number }).count
      : 0;
  if (Array.isArray(raw)) return countOf(raw[0]);
  return countOf(raw);
}

/**
 * Lista de encomendas da loja, mais recentes primeiro.
 * Pesquisa (nome/telefone/referência) e estado vão para o banco —
 * a página nunca recebe a tabela inteira para filtrar no navegador.
 */
export async function listOrders(
  storeId: string,
  filter: { q?: unknown; status?: unknown } = {},
): Promise<OrderListRow[]> {
  const supabase = await createClient();
  const term = sanitizeSearchTerm(filter.q);
  const status = isOrderStatus(filter.status) ? filter.status : null;

  let query = supabase
    .from("orders")
    .select(LIST_COLUMNS)
    .eq("store_id", storeId)
    .order("created_at", { ascending: false })
    .limit(500);

  if (status) query = query.eq("status", status);
  if (term) {
    // `*` = curinga do ilike no PostgREST; o termo já foi higienizado.
    query = query.or(
      `reference.ilike.${term}*,customer_name.ilike.*${term}*,customer_phone.ilike.*${term}*`,
    );
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Falha ao listar encomendas: ${error.message}`);
  }
  // Cast via unknown: o parser de string do PostgREST não conhece
  // `reference` (coluna gerada); o formato vem do schema. `item_count`
  // (agregado embutido) é normalizado para número aqui.
  const rows = (data ?? []) as unknown as Array<
    OrderListRow & { item_count: unknown }
  >;
  return rows.map((row) => ({
    ...row,
    item_count: parseEmbeddedCount(row.item_count),
  }));
}

/**
 * Contagem TOTAL de encomendas da loja ativa (cartão do dashboard).
 *
 * Mesma tabela, mesmo módulo, mesma RLS e mesmo `eq("store_id", …)` de
 * `listOrders` — só que `head: true` com `count: "exact"`: não transfere
 * linhas (a lista tem teto de 500 e o dashboard só precisa do número) e
 * não cria uma segunda fonte de dados. Para lojas até 500 encomendas o
 * valor é idêntico ao comprimento da lista sem filtros.
 */
export async function countOrders(storeId: string): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("store_id", storeId);

  if (error) {
    throw new Error(`Falha ao contar encomendas: ${error.message}`);
  }
  return count ?? 0;
}

/**
 * Uma encomenda + itens, restrita à loja ativa.
 * `orderId` inválido (não-uuid) devolve null sem tocar na rede.
 */
export async function getOrderDetail(
  storeId: string,
  orderId: string,
): Promise<OrderDetailRow | null> {
  if (!isUuid(orderId)) return null;

  const supabase = await createClient();
  // Alias `items:` — o PostgREST devolve a chave do SELECT; sem o alias a
  // chave seria `order_items` e `order.items` seria undefined (o detalhe
  // quebra em `order.items.map`). O alias mantém o nome do tipo.
  const { data, error } = await supabase
    .from("orders")
    .select(
      "*, items:order_items(id, product_id, name, qty, unit_price, options)",
    )
    .eq("store_id", storeId)
    .eq("id", orderId)
    .maybeSingle();

  if (error) {
    throw new Error(`Falha ao carregar encomenda: ${error.message}`);
  }
  return data as OrderDetailRow | null;
}

/**
 * Estado público da encomenda — página `/store/{slug}/order/{uuid}`.
 *
 * O RLS de `orders` é do dono, por isso a leitura passa pelo RPC
 * `order_public_status` (SECURITY DEFINER) que devolve APENAS estado,
 * totais e itens (sem nome/telefone/morada/notas/pagamento). A posse do
 * uuid (capability URL, 122 bits) é a autorização; encomenda de OUTRA
 * loja → `null` → 404.
 *
 * Erro de rede/DB → lança (página honesta, 500) — a ausência real é
 * `null`, que o chamador traduz em `notFound()`.
 */
export async function getOrderTracking(
  storeSlug: string,
  orderId: string,
): Promise<OrderTracking | null> {
  if (!isUuid(orderId)) return null;

  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc("order_public_status", {
    p_store_slug: storeSlug,
    p_order_id: orderId,
  });
  if (error) {
    throw new Error(`Falha ao resolver estado da encomenda: ${error.message}`);
  }
  return parseOrderTracking(data);
}

/** Rótulo i18n do estado (para quem preferir mapear aqui). */
export type { OrderStatus };
