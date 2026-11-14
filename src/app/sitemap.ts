import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { getMarketingUrl } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/public";
import { storePublicUrl } from "@/lib/stores/resolve";

/**
 * Sitemap público — home de marketing + lojas ATIVAS e seus produtos.
 *
 * - Tempo de requisição via `connection()`: lojas/products mudam a
 *   qualquer momento (criação, desativação, novos produtos), então o XML é
 *   gerado a cada requisição — sem rebuild e sem servir URLs obsoletas.
 * - O RLS público já restringe produtos a lojas ativas; o filtro extra por
 *   `store_id` garante que uma consulta parcial nunca vaze URL de loja
 *   desativada.
 * - Se a consulta falhar (rede/RLS), o sitemap ainda entrega a home — um
 *   erro transitório nunca pode quebrar o Search Console.
 *
 * URLs: loja = subdomínio real (`{slug}.elicani.site`, cuja raiz o proxy
 * reescreve para /store/[slug]); produto = caminho absoluto
 * `/store/{slug}/products/{id-ou-slug}`, que funciona no subdomínio E no
 * domínio principal (o proxy só reescreve a raiz do subdomínio).
 *
 * Com `cacheComponents`, o comportamento por-requisição vem de
 * `connection()` (segment config `dynamic = "force-dynamic"` não é
 * permitido): a rota não é pré-renderizada e reflete altas/desativações
 * sem rebuild.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection(); // só a partir daqui, em tempo de requisição
  const marketingUrl = getMarketingUrl();

  const entries: MetadataRoute.Sitemap = [
    {
      // Sem lastModified: a landing não tem data de conteúdo estável e um
      // "now" por requisição mentiria para o crawler ("muda sempre").
      url: marketingUrl,
      changeFrequency: "weekly",
      priority: 1,
    },
  ];

  try {
    const supabase = createPublicClient();
    const [storesResult, productsResult] = await Promise.all([
      supabase
        .from("stores")
        .select("id, slug, updated_at")
        .eq("is_active", true),
      supabase.from("products").select("id, store_id, slug, updated_at"),
    ]);

    if (storesResult.error) throw new Error(storesResult.error.message);

    const stores = storesResult.data ?? [];
    const slugByStoreId = new Map(
      stores.map((store) => [store.id, store.slug] as const),
    );

    const storeEntries: MetadataRoute.Sitemap = stores.map((store) => ({
      url: storePublicUrl(store.slug),
      lastModified: new Date(store.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    const productEntries: MetadataRoute.Sitemap = [];
    if (!productsResult.error && productsResult.data) {
      for (const product of productsResult.data) {
        const slug = slugByStoreId.get(product.store_id);
        if (!slug) continue; // loja inativa ou ausente → fora do sitemap
        productEntries.push({
          // Mesma fórmula da canônica/OG: segmento final = slug, UUID só
          // como fallback (produto sem slug ASCII).
          url: `${storePublicUrl(slug)}/store/${slug}/products/${product.slug ?? product.id}`,
          lastModified: new Date(product.updated_at),
          changeFrequency: "weekly" as const,
          priority: 0.6,
        });
      }
    }

    entries.push(...storeEntries, ...productEntries);
  } catch {
    // Rede/RLS fora do ar: mantém ao menos a home no sitemap.
  }

  return entries;
}
