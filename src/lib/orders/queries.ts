import { createClient } from "@/lib/supabase/server";
import { isOrderStatus, isUuid, sanitizeSearchTerm } from "./search";
import type { OrderStatus } from "./search";

/**
 * Leituras do módulo ENCOMENDAS (painel).
 *
 * Tudo aqui corre no servidor com a sessão do DONO: o RLS de SELECT
 * (linha = loja própria) é a autoridade; a loja ativa é reforçada com
 * `eq("store_id", …)` para nunca sequer pedir linhas de outra loja.
 * Nada disto chega ao navegador sem passar pelas páginas RSC.
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
  "customer_phone, payment, total, delivery_fee";

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
  // `reference` (coluna gerada); o formato vem do schema.
  return (data ?? []) as unknown as OrderListRow[];
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

/** Rótulo i18n do estado (para quem preferir mapear aqui). */
export type { OrderStatus };
