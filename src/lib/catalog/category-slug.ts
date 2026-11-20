/**
 * Slug público de categoria — PURO (sem cliente, sem imports de alias):
 * o MESMO módulo alimenta a action de criação, o backfill de produção
 * (scripts/backfill-category-slugs.mjs) e os testes — geração idêntica
 * nos três caminhos.
 *
 * Papel na arquitetura de identidade:
 *   ELICANI → loja (`stores.slug`, vira subdomínio) → categoria
 *   (`categories.slug`, vira o último segmento de /store/{loja}/categorias/…)
 *   → produto.
 *
 * O ALGORITMO é o de produto (partilhado de propósito): as regras são
 * idênticas (ASCII previsível, teto 63, resultado vazio → `null`, slug
 * estável, uniqueness por loja) e uma fonte única evita que as duas
 * famílias de URL evoluam para formatos diferentes.
 *
 * Regras (espelho de product-slug.ts):
 *  • slug gerado UMA vez (criação) e NUNCA muda com o rename da
 *    categoria — estabilidade de URL é regra, não acidente;
 *  • `null` → a categoria continua publicável pela URL com UUID —
 *    fallback honesto, nunca um slug inválido;
 *  • uniqueness é POR LOJA (`unique(store_id, slug)` no banco).
 */
import { slugifyProductName, uniqueProductSlug } from "./product-slug.ts";

/** Converte o nome da categoria em slug (mesmas regras do produto). */
export function slugifyCategoryName(name: string): string | null {
  return slugifyProductName(name);
}

/**
 * Primeiro slug livre do conjunto (mesma resolução `-2`, `-3`… do
 * produto — determinística, dentro do teto de 63).
 */
export function uniqueCategorySlug(
  base: string,
  taken: ReadonlySet<string>,
): string {
  return uniqueProductSlug(base, taken);
}

/**
 * Segmento público da categoria: slug quando existe, senão o UUID — a
 * ÚNICA fórmula usada por chips/cards, canônica, breadcrumb, OG e sitemap
 * (uma fonte, zero divergência entre os sinais públicos).
 */
export function categorySlugOrId(category: {
  id: string;
  slug?: string | null;
}): string {
  return category.slug || category.id;
}
