import "server-only";

import { createPublicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import type { PublicCategory, PublicProduct, StoreCatalog } from "./types";

/**
 * Consultas PÚBLICAS do catálogo — usadas pela vitrine com o cliente SEM
 * SESSÃO (papel `anon`). O RLS público devolve produtos/categorias apenas
 * de lojas ATIVAS; campos são selecionados explicitamente (nada de "*").
 */
const PRODUCT_PUBLIC_FIELDS =
  "id, category_id, name, description, price, promo_price, image_url, is_available, is_featured, sort_order";

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
