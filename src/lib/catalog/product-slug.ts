/**
 * Slug público de produto — PURO (sem cliente, sem imports de alias):
 * o MESMO módulo alimenta a action de criação, o backfill de produção
 * (scripts/backfill-product-slugs.mjs) e os testes — geração idêntica
 * nos três caminhos.
 *
 * Papel na arquitetura de identidade:
 *   ELICANI → loja (`stores.slug`, vira subdomínio) → produto
 *   (`products.slug`, vira o último segmento de /store/{loja}/products/…).
 *
 * Regras:
 *  • ASCII previsível: NFD + remoção de diacríticos → minúsculas →
 *    tudo que não for [a-z0-9] vira hífen (colapsado, aparado);
 *  • resultado VAZIO (nome sem caracteres ASCII, ex.: só símbolos ou
 *    grafia não latina) → `null`: o produto continua publicável pela URL
 *    com UUID — fallback honesto, nunca um slug inválido;
 *  • o slug é gerado UMA vez (criação) e NUNCA muda com o rename do
 *    produto — estabilidade de URL é regra, não acidente;
 *  • uniqueness é POR LOJA (`unique(store_id, slug)` no banco): o caminho
 *    público já carrega a loja, então colisão entre lojas é irrelevante.
 */

/** Mesmo teto do segmento de domínio: 63 (RFC 1035). */
export const PRODUCT_SLUG_MAX_LENGTH = 63;

/**
 * Converte o nome do produto em slug. `null` quando não sobra nada
 * utilizável (ou quando o corte de 63 deixaria apenas hífen).
 */
export function slugifyProductName(name: string): string | null {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // diacríticos decompostos (U+0300–U+036F)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, PRODUCT_SLUG_MAX_LENGTH)
    .replace(/-+$/g, ""); // o corte pode ter terminado em hífen
  return base || null;
}

/**
 * Primeiro slug livre do conjunto: `base`, `base-2`, `base-3`… —
 * determinístico (mesmos nomes na mesma ordem geram os mesmos slugs).
 * O sufixo entra DENTRO do teto de 63: o base é aparado para caber.
 */
export function uniqueProductSlug(
  base: string,
  taken: ReadonlySet<string>,
): string {
  if (!taken.has(base)) return base;

  for (let n = 2; ; n += 1) {
    const suffix = `-${n}`;
    const head = base
      .slice(0, PRODUCT_SLUG_MAX_LENGTH - suffix.length)
      .replace(/-+$/g, "");
    const candidate = `${head}${suffix}`;
    if (!taken.has(candidate)) return candidate;
  }
}

/**
 * Segmento público do produto: slug quando existe, senão o UUID — a ÚNICA
 * fórmula usada por cards, relacionados, canônica, OG e sitemap (uma
 * fonte, zero divergência entre os sinais públicos).
 */
export function productSlugOrId(product: {
  id: string;
  slug?: string | null;
}): string {
  return product.slug || product.id;
}
