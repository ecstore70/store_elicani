import { createClient } from "@/lib/supabase/client";

/**
 * Fundação de EVENTOS anónimos da vitrine — o mínimo útil, sem PII.
 *
 * Fire-and-forget NUNCA quebra a experiência do cliente: qualquer falha
 * (rede, loja inativa, RLS) é silenciosamente ignorada. Só existem quatro
 * eventos (whitelist também no banco, na RPC `record_event`):
 *
 *   • catalog_view     — visita à grelha do catálogo
 *   • product_view     — visita à página de produto
 *   • add_to_cart      — item entra no carrinho
 *   • checkout_started — o checkout abre
 *
 * O que JÁ vive noutras tabelas NÃO é duplicado aqui: `order_created` e
 * `whatsapp_cta` são a própria linha de `orders` (`created_at` +
 * `whatsapp_opened_at`); clientes são encomendas, não eventos. Nenhum
 * destes eventos contém nome/telefone/morada.
 */
export type StoreEvent =
  | "catalog_view"
  | "product_view"
  | "add_to_cart"
  | "checkout_started";

export function trackStoreEvent(
  storeId: string,
  event: StoreEvent,
  productId?: string,
): void {
  if (!storeId) return;
  try {
    const supabase = createClient();
    void supabase
      .rpc("record_event", {
        p_store_id: storeId,
        p_event: event,
        // typegen regenerado: o argumento é opcional (DEFAULT NULL no
        // banco) — omitir é equivalente a mandar null explicitamente.
        p_product_id: productId ?? undefined,
      })
      .then(() => undefined, () => undefined);
  } catch {
    // analytics nunca afeta o fluxo de compra
  }
}
