import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/env";

/**
 * Cliente Supabase para o browser (Componentes de Cliente).
 *
 * Usa somente a chave pública `anon`, que é limitada pelo RLS.
 * Credenciais privilegiadas (service_role) nunca passam por aqui.
 */
export function createClient() {
  return createBrowserClient<Database>(getSupabaseUrl(), getSupabaseAnonKey());
}
