/**
 * Contexto de loja ATIVA (multi-catalog) — módulo PURO (sem I/O).
 *
 * Uma conta pode ter N lojas; o painel precisa de uma explícita "loja que
 * está a ser gerida AGORA". A escolha fica num cookie lido/gravado fora
 * deste módulo (next/headers) — aqui só a regra pura, testável sem
 * requisição e sem Next.
 */

/** Cookie que guarda o id da loja ativa do painel (lido só no servidor). */
export const ACTIVE_STORE_COOKIE = "elicani_active_store";

/**
 * Escolhe a loja ativa a partir da lista PRÓPRIA do lojista.
 *
 * A lista já vem filtrada por dono (filtro no cliente + RLS no banco) e
 * ordenada por criação (mais antiga primeiro) — por isso a última posição
 * é a mais recente.
 *
 * Regras, em ordem:
 *  1. sem lojas → `null` (onboarding);
 *  2. uma loja → ela mesma — contas existentes não dependem de cookie
 *     nenhum e o fluxo onboarding → dashboard continua idêntico;
 *  3. cookie presente na lista → a loja escolhida (troca explícita);
 *  4. cookie ausente/inválido (loja apagada, expirada, forjada) → a loja
 *     mais recente — determinístico e SEMPRE do próprio dono. Uma id de
 *     outra conta nunca casa com a lista, portanto nunca é devolvida.
 */
export function pickActiveStore<T extends { id: string }>(
  stores: readonly T[],
  activeId: string | null,
): T | null {
  if (stores.length === 0) return null;
  if (stores.length === 1) return stores[0];
  if (activeId) {
    const match = stores.find((store) => store.id === activeId);
    if (match) return match;
  }
  return stores[stores.length - 1];
}
