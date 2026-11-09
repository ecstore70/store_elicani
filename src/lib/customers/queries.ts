import { createClient } from "@/lib/supabase/server";
import {
  summarizeCustomers,
  type CustomerOrderRow,
  type CustomerSummary,
} from "./aggregate";

/**
 * Leituras do módulo CLIENTES — derivado 100% de `orders` (sem tabela
 * nova). Uma única consulta leve por página; a agregação acontece no
 * servidor (RLS do dono + `eq("store_id")` antes de qualquer linha).
 */

/** Teto coerente com os relatórios: lojas muito grandes truncam aqui. */
const MAX_ORDERS = 5000;

const COLUMNS =
  "id, reference, status, total, created_at, customer_name, customer_phone";

function toRow(raw: {
  id: string;
  reference: string;
  status: string;
  total: number;
  created_at: string;
  customer_name: string;
  customer_phone: string;
}): CustomerOrderRow {
  return {
    id: raw.id,
    reference: raw.reference,
    status: raw.status,
    total: raw.total,
    createdAt: raw.created_at,
    customerName: raw.customer_name,
    customerPhone: raw.customer_phone,
  };
}

/** Resumos de clientes da loja, do mais recente para o mais antigo. */
export async function getCustomers(
  storeId: string,
): Promise<CustomerSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(COLUMNS)
    .eq("store_id", storeId)
    .order("created_at", { ascending: false })
    .limit(MAX_ORDERS);

  if (error) {
    throw new Error(`Falha ao listar clientes: ${error.message}`);
  }
  return summarizeCustomers((data ?? []).map(toRow));
}

/** Um cliente (pela chave do telefone) da loja ativa; null se não existir. */
export async function getCustomer(
  storeId: string,
  customerKeyId: string,
): Promise<CustomerSummary | null> {
  const customers = await getCustomers(storeId);
  return (
    customers.find((customer) => customer.key === customerKeyId) ?? null
  );
}
