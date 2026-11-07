import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { redirect } from "next/navigation";
import { createPublicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import type { Profile, PublicStore, Store } from "./types";

/**
 * Store do lojista autenticado.
 *
 * O RLS já garante que só a própria store é retornada — aqui não há
 * filtro por owner_id porque a política faz isso no banco.
 *
 * `'use cache: private'` mantém a leitura fora do shell estático e
 * deduplica as chamadas (layout + página) dentro da mesma requisição.
 *
 * `cacheTag("store")` permite invalidar esta entrada sob demanda com
 * `updateTag("store")` após uma mutação do catálogo (ativar/desativar/
 * excluir) — sem isso o painel serviria a loja fantasma do cache por
 * até o janela de `stale`.
 */
export async function getStoreForOwner(ownerId: string): Promise<Store | null> {
  "use cache: private";
  cacheLife({ stale: 30 });
  cacheTag("store");

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("stores")
    .select("*")
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load store: ${error.message}`);
  }

  return data;
}

/**
 * Store do usuário autenticado, obrigatória nas rotas /app com store.
 * Sem store → onboarding.
 */
export async function requireStore(ownerId: string): Promise<Store> {
  const store = await getStoreForOwner(ownerId);
  if (!store) {
    redirect("/app/onboarding");
  }
  return store;
}

/** Profile do usuário autenticado. */
export async function getProfile(userId: string): Promise<Profile | null> {
  "use cache: private";
  cacheLife({ stale: 30 });

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load profile: ${error.message}`);
  }

  return data;
}

/**
 * Store pública por slug — usada pela resolução de {slug}.elicani.site.
 *
 * Roda com o cliente SEM SESSÃO (papel `anon`): o RLS público devolve
 * apenas lojas ativas, e um lojista autenticado não consegue ler lojas
 * alheias nem mesmo pela API. Campos são selecionados explicitamente
 * (nada de "*") — `owner_id` em especial nunca sai daqui.
 */
export async function getPublicStoreBySlug(slug: string): Promise<PublicStore | null> {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("stores")
    .select(
      "id, name, slug, description, logo_url, favicon_url, banner_url, whatsapp_number, primary_color, template, button_color, accent_color, background_color, product_layout, image_ratio, button_style, card_style, opening_hours, instagram_url, facebook_url, currency, language, is_active, created_at, updated_at",
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to resolve store: ${error.message}`);
  }

  if (!data || !data.is_active) return null;

  return data;
}

/** Estado público de uma loja pelo slug — ver `getPublicStoreStatus`. */
export type PublicStoreStatus = "active" | "inactive" | "missing";

/**
 * Estado público de um slug de loja via `store_public_status` (SECURITY DEFINER).
 *
 * O RLS esconde lojas INATIVAS do papel `anon`, então nem o proxy nem as
 * páginas da vitrine distinguiriam "inativa" (estado indisponível, 200) de
 * "inexistente" (404 real) consultando a tabela diretamente. A função devolve
 * APENAS o estado ('active' | 'inactive' | null) — nenhum dado do comerciante.
 *
 * Falha em aberto → `"active"`: a página revalida e decide por conta própria
 * (mesma convenção do proxy — nunca derrubar a vitrine por erro transiente).
 */
export async function getPublicStoreStatus(slug: string): Promise<PublicStoreStatus> {
  const supabase = createPublicClient();

  try {
    const { data, error } = await supabase.rpc("store_public_status", {
      p_slug: slug,
    });
    if (error) return "active";
    if (data === "inactive") return "inactive";
    if (data === "active") return "active";
    return "missing";
  } catch {
    return "active";
  }
}
