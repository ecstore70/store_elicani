import "server-only";

import { cacheLife } from "next/cache";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Usuário autenticado ou null.
 *
 * Usa auth.getUser(), que valida o token junto ao Supabase Auth —
 * diferente de getSession(), que apenas decodifica o cookie local.
 *
 * `'use cache: private'` mantém a leitura fora do shell estático (Cache
 * Components) e deduplica as várias chamadas de uma mesma requisição.
 * `stale` curto: o cliente não deve guardar estado de sessão.
 */
export async function getUser(): Promise<User | null> {
  "use cache: private";
  cacheLife({ stale: 30 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Exige usuário autenticado. Redireciona para /login quando não houver.
 * Usado nas camadas de layout como defesa em profundidade — o proxy já
 * bloqueia, mas server actions e páginas devem se validar sozinhas.
 */
export async function requireUser(): Promise<User> {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}
