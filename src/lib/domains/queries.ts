import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { DomainSummary } from "./types";

/**
 * Domínios da PRÓPRIA loja (editor do painel). Usa o cliente com SESSÃO:
 * a política `store_domains_select_own` devolve só as linhas cujo store_id
 * pertence ao lojista autenticado — o card da loja ativa nunca enxerga
 * domínios de outra loja (multi-catalog) nem de outro lojista.
 *
 * O `verification_token` é incluído de propósito: o dono precisa dele para
 * criar o registro TXT (Fase 2 §3). Ele NUNCA aparece em APIs públicas —
 * `store_by_hostname()` só devolve store_id/slug/is_active.
 */
export async function getDomainsForStore(
  storeId: string,
): Promise<DomainSummary[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("store_domains")
    .select(
      "id, hostname, status, last_error, verification_token, verified_at",
    )
    .eq("store_id", storeId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to load store domains: ${error.message}`);
  }

  return data ?? [];
}
