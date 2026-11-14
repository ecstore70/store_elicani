import "server-only";

import { createPublicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import type { MediaItemInput } from "./media";
import type { PageBlockInput, PageBlockType } from "./page-blocks";
import type {
  PublicCategory,
  PublicMediaItem,
  PublicPageBlock,
  PublicProduct,
  StoreCatalog,
} from "./types";

/**
 * Consultas PÚBLICAS do catálogo — usadas pela vitrine com o cliente SEM
 * SESSÃO (papel `anon`). O RLS público devolve produtos/categorias apenas
 * de lojas ATIVAS; campos são selecionados explicitamente (nada de "*").
 */
const PRODUCT_PUBLIC_FIELDS =
  "id, category_id, name, description, price, promo_price, slug, image_url, is_available, is_featured, sort_order";

const CATEGORY_PUBLIC_FIELDS = "id, name, sort_order, is_active";

/** Catálogo completo de uma loja ativa, ordenado pelo comerciante. */
export async function getPublicCatalog(storeId: string): Promise<StoreCatalog> {
  const supabase = createPublicClient();

  const [productsResult, categoriesResult] = await Promise.all([
    supabase
      .from("products")
      .select(PRODUCT_PUBLIC_FIELDS)
      .eq("store_id", storeId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("categories")
      .select(CATEGORY_PUBLIC_FIELDS)
      .eq("store_id", storeId)
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
  ]);

  if (productsResult.error) {
    throw new Error(`Failed to load products: ${productsResult.error.message}`);
  }
  if (categoriesResult.error) {
    throw new Error(
      `Failed to load categories: ${categoriesResult.error.message}`,
    );
  }

  return {
    products: (productsResult.data ?? []) as PublicProduct[],
    categories: (categoriesResult.data ?? []) as PublicCategory[],
  };
}

/**
 * Consultas do PRÓPRIO catálogo — sempre com `.eq("store_id", ...)` por
 * defesa em profundidade; o RLS já restringe às lojas do lojista.
 */
export async function listCategoriesForOwner(
  storeId: string,
): Promise<PublicCategory[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .select("id, name, sort_order, is_active")
    .eq("store_id", storeId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to load categories: ${error.message}`);
  }

  return (data ?? []) as PublicCategory[];
}

/** Categorias incluindo o campo de loja — usado pelo form de produto. */
export async function listCategoriesWithStoreForOwner(
  storeId: string,
): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .select("id, name")
    .eq("store_id", storeId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to load categories: ${error.message}`);
  }

  return data ?? [];
}

export async function listProductsForOwner(storeId: string): Promise<PublicProduct[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_PUBLIC_FIELDS)
    .eq("store_id", storeId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to load products: ${error.message}`);
  }

  return (data ?? []) as PublicProduct[];
}

/** Um produto da própria loja (para edição). `null` se não existir. */
export async function getProductForOwner(
  storeId: string,
  productId: string,
): Promise<PublicProduct | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_PUBLIC_FIELDS)
    .eq("store_id", storeId)
    .eq("id", productId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load product: ${error.message}`);
  }

  return data as PublicProduct | null;
}

// ── galeria de mídia ──────────────────────────────────────────────────────

const MEDIA_PUBLIC_FIELDS = "media_type, source_url, display_order";

/** Galeria do produto da PRÓPRIA loja (edição), em ordem de exibição. */
export async function listMediaForOwner(
  storeId: string,
  productId: string,
): Promise<MediaItemInput[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("product_media")
    .select("id, media_type, source_url, display_order")
    .eq("store_id", storeId)
    .eq("product_id", productId)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to load media: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    type: row.media_type as MediaItemInput["type"],
    url: row.source_url,
  }));
}

/**
 * Galeria PÚBLICA de um produto — cliente `anon`; o RLS público só devolve
 * mídias de lojas ATIVAS. Ordenação igual à da vitrine (ordem do lojista).
 */
export async function getPublicProductMedia(
  productId: string,
): Promise<PublicMediaItem[]> {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("product_media")
    .select(MEDIA_PUBLIC_FIELDS)
    .eq("product_id", productId)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to load media: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    type: row.media_type as PublicMediaItem["type"],
    url: row.source_url,
  }));
}

// ── blocos de conteúdo da página do produto ─────────────────────────────────

/**
 * Blocos do produto da PRÓPRIA loja (edição), na sequência do comerciante.
 */
export async function listPageBlocksForOwner(
  storeId: string,
  productId: string,
): Promise<PageBlockInput[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("product_page_blocks")
    .select("id, type, content, media_url, caption, alt_text, sort_order")
    .eq("store_id", storeId)
    .eq("product_id", productId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to load page blocks: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    type: row.type as PageBlockType,
    content: row.content ?? undefined,
    media_url: row.media_url ?? undefined,
    caption: row.caption ?? undefined,
    alt_text: row.alt_text ?? undefined,
  }));
}

/**
 * Blocos PÚBLICOS do produto — cliente `anon`; o RLS público só devolve
 * blocos de produtos de lojas ATIVAS. A sequência é a do comerciante
 * (sort_order) — nenhum id nem tenant trafega para a vitrine.
 */
export async function getPublicProductBlocks(
  productId: string,
): Promise<PublicPageBlock[]> {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("product_page_blocks")
    .select("type, content, media_url, caption, alt_text, sort_order")
    .eq("product_id", productId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to load page blocks: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    type: row.type as PageBlockType,
    content: row.content,
    media_url: row.media_url,
    caption: row.caption,
    alt_text: row.alt_text,
  }));
}
