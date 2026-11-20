import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { getMarketingUrl } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/public";
import {
  categoryCanonicalUrl,
  productCanonicalUrl,
  storeCanonicalUrl,
  storeSubpageCanonicalUrl,
} from "@/lib/stores/metadata";

/**
 * Sitemap público — home + diretório /stores da plataforma, lojas ATIVAS,
 * seus documentos publicados, CATEGORIAS ativas e produtos.
 *
 * - Tempo de requisição via `connection()`: lojas/products/categories
 *   mudam a qualquer momento (criação, desativação, novos itens), então o
 *   XML é gerado a cada requisição — sem rebuild e sem servir URLs
 *   obsoletas.
 * - O RLS público já restringe produtos/categorias a lojas ativas; o
 *   filtro extra por `store_id` garante que uma consulta parcial nunca
 *   vaze URL de loja desativada.
 * - Se a consulta falhar (rede/RLS), o sitemap ainda entrega a home — um
 *   erro transitório nunca pode quebrar o Search Console.
 *
 * URLs: SEMPRE pelos builders de stores/metadata.ts (fonte única da
 * fórmula canônica — canônica, OG e sitemap nunca divergem): loja =
 * subdomínio real (`{slug}.elicani.site`, cuja raiz o proxy reescreve
 * para /store/[slug]); documentos/produtos/categorias = caminho absoluto
 * `/store/{slug}/…` que funciona no subdomínio E no domínio principal.
 * A fórmula do segmento final é `slug ?? id` (UUID como fallback).
 *
 * Com `cacheComponents`, o comportamento por-requisição vem de
 * `connection()` (segment config `dynamic = "force-dynamic"` não é
 * permitido): a rota não é pré-renderizada e reflete altas/desativações
 * sem rebuild.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection(); // só a partir daqui, em tempo de requisição
  const marketingUrl = getMarketingUrl().replace(/\/+$/, "");

  const entries: MetadataRoute.Sitemap = [
    {
      // Sem lastModified: a landing não tem data de conteúdo estável e um
      // "now" por requisição mentiria para o crawler ("muda sempre").
      url: marketingUrl,
      changeFrequency: "weekly",
      priority: 1,
    },
    // Documentos legais da PLATAFORMA — páginas estáticas de conteúdo,
    // mesmo racional da landing (sem lastModified). Só entram URLs que
    // existem de fato (as rotas são publicadas no build). O diretório
    // /stores é a ponte crawlável plataforma → lojas (sitemaps não são
    // a única relação) — muda quando lojas entram/saem, por isso
    // lastModified também fica de fora (sem data de conteúdo estável).
    {
      url: `${marketingUrl}/stores`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    },
    {
      url: `${marketingUrl}/terms`,
      changeFrequency: "yearly" as const,
      priority: 0.5,
    },
    {
      url: `${marketingUrl}/privacy`,
      changeFrequency: "yearly" as const,
      priority: 0.5,
    },
    {
      url: `${marketingUrl}/faq`,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
  ];

  try {
    const supabase = createPublicClient();
    const [storesResult, productsResult, faqResult, categoriesResult] =
      await Promise.all([
        supabase
          .from("stores")
          .select("id, slug, updated_at, terms, privacy_policy")
          .eq("is_active", true),
        supabase.from("products").select("id, store_id, slug, updated_at"),
        // RLS pública = só itens de lojas ATIVAS (nenhuma URL de loja
        // inativada vaza para cá). Falha → segue sem as URLs de FAQ.
        supabase.from("store_faq_items").select("store_id, updated_at"),
        // RLS pública = só categorias de lojas ATIVAS; o filtro is_active
        // é redundante de propósito (inativa some da vitrine e do sitemap).
        // Falha → segue sem as URLs de categoria.
        supabase
          .from("categories")
          .select("id, store_id, slug, updated_at")
          .eq("is_active", true),
      ]);

    if (storesResult.error) throw new Error(storesResult.error.message);

    const stores = storesResult.data ?? [];
    const slugByStoreId = new Map(
      stores.map((store) => [store.id, store.slug] as const),
    );

    const storeEntries: MetadataRoute.Sitemap = stores.map((store) => ({
      url: storeCanonicalUrl(store.slug),
      lastModified: new Date(store.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    // Páginas de documento da loja — SÓ com conteúdo publicado (URL sem
    // conteúdo é 404 e nunca entra no sitemap). FAQ: presença e
    // lastModified vêm dos itens (edição mais recente da loja).
    const faqByStoreId = new Map<string, string>();
    if (!faqResult.error && faqResult.data) {
      for (const item of faqResult.data) {
        const previous = faqByStoreId.get(item.store_id);
        if (!previous || item.updated_at > previous) {
          faqByStoreId.set(item.store_id, item.updated_at);
        }
      }
    }

    const policyEntries: MetadataRoute.Sitemap = [];
    for (const store of stores) {
      if (store.terms) {
        policyEntries.push({
          url: storeSubpageCanonicalUrl(store.slug, "terms"),
          lastModified: new Date(store.updated_at),
          changeFrequency: "monthly" as const,
          priority: 0.5,
        });
      }
      if (store.privacy_policy) {
        policyEntries.push({
          url: storeSubpageCanonicalUrl(store.slug, "privacy"),
          lastModified: new Date(store.updated_at),
          changeFrequency: "monthly" as const,
          priority: 0.5,
        });
      }
      const faqUpdated = faqByStoreId.get(store.id);
      if (faqUpdated) {
        policyEntries.push({
          url: storeSubpageCanonicalUrl(store.slug, "faq"),
          lastModified: new Date(faqUpdated),
          changeFrequency: "monthly" as const,
          priority: 0.5,
        });
      }
    }

    // Categorias ativas — mesma fórmula da canônica/OG. Loja inativa ou
    // ausente → fora do sitemap (slugByStoreId não a conhece).
    const categoryEntries: MetadataRoute.Sitemap = [];
    if (!categoriesResult.error && categoriesResult.data) {
      for (const category of categoriesResult.data) {
        const slug = slugByStoreId.get(category.store_id);
        if (!slug) continue;
        categoryEntries.push({
          url: categoryCanonicalUrl(slug, category.slug ?? category.id),
          lastModified: new Date(category.updated_at),
          changeFrequency: "weekly" as const,
          priority: 0.7,
        });
      }
    }

    const productEntries: MetadataRoute.Sitemap = [];
    if (!productsResult.error && productsResult.data) {
      for (const product of productsResult.data) {
        const slug = slugByStoreId.get(product.store_id);
        if (!slug) continue; // loja inativa ou ausente → fora do sitemap
        productEntries.push({
          // Segmento final = slug, UUID só como fallback (produto sem
          // slug ASCII) — mesma fórmula da canônica/OG.
          url: productCanonicalUrl(slug, product.slug ?? product.id),
          lastModified: new Date(product.updated_at),
          changeFrequency: "weekly" as const,
          priority: 0.6,
        });
      }
    }

    entries.push(
      ...storeEntries,
      ...policyEntries,
      ...categoryEntries,
      ...productEntries,
    );
  } catch {
    // Rede/RLS fora do ar: mantém ao menos a home no sitemap.
  }

  return entries;
}
