import { createClient } from "@/lib/supabase/server";
import { isValidSale } from "../reports/aggregate";
import {
  countByDeliveryStatus,
  isDeliveryStatus,
  type DeliveryStatus,
} from "./status";

/**
 * Leituras do módulo ENTREGA — uma única consulta leve à tabela
 * `orders` da loja (RLS do dono + `eq("store_id")`), com as colunas de
 * morada/estado de entrega. A filtragem e as contagens são calculadas
 * no servidor: o navegador nunca recebe a tabela crua.
 *
 * Fora da lista: encomendas CANCELADAS (nada a entregar).
 */
export type DeliveryRow = {
  id: string;
  reference: string;
  status: string;
  delivery_status: string;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string | null;
  customer_neighborhood: string | null;
  delivery_fee: number | null;
};

export type DeliveryData = {
  /** Linhas do período todo (canceladas excluídas) — base das contagens. */
  all: DeliveryRow[];
  /** Linhas visíveis depois do filtro de estado. */
  visible: DeliveryRow[];
  counts: Record<DeliveryStatus, number>;
};

const COLUMNS =
  "id, reference, status, delivery_status, created_at, customer_name, " +
  "customer_phone, customer_address, customer_neighborhood, delivery_fee";

const MAX_ORDERS = 5000;

export async function getDeliveryData(
  storeId: string,
  filter: { status?: unknown } = {},
): Promise<DeliveryData> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(COLUMNS)
    .eq("store_id", storeId)
    .order("created_at", { ascending: false })
    .limit(MAX_ORDERS);

  if (error) {
    throw new Error(`Falha ao listar entregas: ${error.message}`);
  }

  // Cast via unknown: o parser de string do PostgREST não conhece
  // `reference` (coluna gerada); o formato vem do schema.
  const all = ((data ?? []) as unknown as DeliveryRow[]).filter((row) =>
    isValidSale(row.status),
  );
  const counts = countByDeliveryStatus(all);

  const wanted: DeliveryStatus | null = isDeliveryStatus(filter.status)
    ? filter.status
    : null;
  const visible = wanted
    ? all.filter((row) => row.delivery_status === wanted)
    : all;

  return { all, visible, counts };
}
