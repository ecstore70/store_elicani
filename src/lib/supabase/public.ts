import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/env";

/**
 * Cliente SUPABASE PÚBLICO — sem sessão.
 *
 * Diferente de `createClient()` (que lê os cookies e assume a identidade do
 * visitante), este cliente usa apenas a chave ANON, portanto TODA query roda
 * como o papel `anon`. É o que a vitrine pública usa, porque:
 *
 *  1. o RLS público vale só para `anon` — um lojista logado não consegue
 *     ler lojas alheias nem pela UI nem pela API;
 *  2. a própria vitrine não deve depender do estado de sessão de quem
 *     visita — um lojista que abra a própria loja continua a vê-la.
 */
export function createPublicClient() {
  return createSupabaseClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
