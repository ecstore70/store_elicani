import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/env";

/**
 * Cliente Supabase para o servidor (Server Components, Server Actions,
 * Route Handlers).
 *
 * A sessão vem dos cookies; o refresh do token acontece no proxy
 * (src/proxy.ts). Aqui só lemos/escrevemos os cookies.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Chamado a partir de Server Components: o refresh já foi feito
          // no proxy, então ignorar aqui é seguro.
        }
      },
    },
  });
}
