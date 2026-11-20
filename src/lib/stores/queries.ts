import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createPublicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import { ACTIVE_STORE_COOKIE, pickActiveStore } from "./active";
import type { Profile, PublicFaqItem, PublicStore, Store } from "./types";

/**
 * TODAS as lojas do lojista (multi-catalog), em ordem de criação — a mais
 * antiga primeiro; a última posição é a mais recente (ver pickActiveStore).
 *
 * O RLS já garante que só as próprias stores são retornadas — o filtro por
 * owner_id aqui é redundante de propósito (defesa em profundidade, nunca
 * filtro só de UI).
 *
 * `'use cache: private'` mantém a leitura fora do shell estático e
 * deduplica as chamadas (layout + página) dentro da mesma requisição.
 *
 * `cacheTag("store")` permite invalidar esta entrada sob demanda com
 * `updateTag("store")` após uma mutação do catálogo (criar/ativar/
 * excluir) — sem isso o painel serviria lojas fantasma do cache por
 * até a janela de `stale`.
 */
export async function getStoresForOwner(ownerId: string): Promise<Store[]> {
  "use cache: private";
  cacheLife({ stale: 30 });
  cacheTag("store");

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("stores")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    throw new Error(`Failed to load stores: ${error.message}`);
  }

  return data ?? [];
}

/**
 * Loja ATIVA do lojista — o contexto explícito do painel (multi-catalog).
 *
 * O cookie só aponta para uma loja da lista do PRÓPRIO dono: um id
 * forjado, expirado ou de outra conta cai na fallback determinística
 * (loja mais recente). Conta com UMA loja não lê cookie nenhum — o
 * fluxo existente (onboarding → dashboard) continua idêntico.
 */
export async function resolveActiveStore(
  ownerId: string,
): Promise<Store | null> {
  const stores = await getStoresForOwner(ownerId);
  if (stores.length === 0) return null;
  if (stores.length === 1) return stores[0];

  const cookieStore = await cookies();
  const activeId = cookieStore.get(ACTIVE_STORE_COOKIE)?.value ?? null;
  return pickActiveStore(stores, activeId);
}

/**
 * Store do usuário autenticado, obrigatória nas rotas /app com store.
 * Sem store → onboarding. Com várias → a loja ATIVA (cookie validado
 * contra a lista de lojas do próprio dono).
 */
export async function requireStore(ownerId: string): Promise<Store> {
  const store = await resolveActiveStore(ownerId);
  if (!store) {
    redirect("/app/onboarding");
  }
  return store;
}

/**
 * Itens de FAQ da PRÓPRIA loja — editor do painel. Usa o cliente com
 * SESSÃO: a política `store_faq_items_*_own` devolve os itens mesmo
 * quando a loja está inativa (a vitrine pública, não).
 */
export async function getFaqItemsForStore(storeId: string): Promise<PublicFaqItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("store_faq_items")
    .select("id, store_id, question, answer, sort_order, created_at, updated_at")
    .eq("store_id", storeId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to load FAQ items: ${error.message}`);
  }

  return data ?? [];
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
      "id, name, slug, description, logo_url, favicon_url, banner_url, whatsapp_number, primary_color, template, button_color, accent_color, background_color, product_layout, image_ratio, button_style, card_style, opening_hours, instagram_url, facebook_url, currency, language, is_active, created_at, updated_at, terms, privacy_policy",
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to resolve store: ${error.message}`);
  }

  if (!data || !data.is_active) return null;

  return data;
}

/** Resumo de loja para o cartão do diretório público /stores. */
export type PublicStoreSummary = Pick<
  PublicStore,
  "id" | "name" | "slug" | "description" | "logo_url" | "banner_url"
>;

/**
 * Lojas ATIVAS para o diretório público /stores — a ponte crawlável
 * plataforma → lojas (o sitemap não é a única relação entre elas).
 *
 * Cliente SEM SESSÃO (anon): o RLS público devolve só lojas ativas e o
 * filtro `.eq("is_active", true)` é redundante de propósito (defesa em
 * profundidade, igual ao sitemap). Campos mínimos de cartão, selecionados
 * explicitamente (nada de "*") — `owner_id` em especial nunca sai daqui.
 * Ordenação estável por nome: mesmos dados → mesma ordem.
 *
 * Sem cache (espelho das queries públicas da vitrine): a página
 * `/stores` é `instant = false` e reflete ativações/desativações a cada
 * requisição, sem rebuild.
 */
export async function listActivePublicStores(): Promise<PublicStoreSummary[]> {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("stores")
    .select("id, name, slug, description, logo_url, banner_url")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to list public stores: ${error.message}`);
  }

  return data ?? [];
}

/**
 * Itens de FAQ PÚBLICOS de uma loja (vitrine + visibilidade do link no
 * rodapé). O RLS público só devolve itens de lojas ATIVAS; a página
 * decide 404/ocultar quando a lista vem vazia.
 */
export async function getPublicStoreFaq(storeId: string): Promise<PublicFaqItem[]> {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("store_faq_items")
    .select("id, store_id, question, answer, sort_order, created_at, updated_at")
    .eq("store_id", storeId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to load store FAQ: ${error.message}`);
  }

  return data ?? [];
}

/**
 * A loja tem FAQ publicado? — consulta mínima (head count) usada pelo
 * RODAPÉ da vitrine para decidir se o link "FAQ" aparece: sem conteúdo
 * não há link (nunca página em branco nem link partido).
 *
 * Falha de consulta → `false` (oculta o link em vez de arriscar um
 * link para 404). Só o rodapé público usa isto — o editor do painel
 * carrega os itens completos via `getFaqItemsForStore`.
 */
export async function hasPublicStoreFaq(storeId: string): Promise<boolean> {
  const supabase = createPublicClient();

  const { count, error } = await supabase
    .from("store_faq_items")
    .select("id", { count: "exact", head: true })
    .eq("store_id", storeId)
    .limit(1);

  if (error) return false;

  return (count ?? 0) > 0;
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
