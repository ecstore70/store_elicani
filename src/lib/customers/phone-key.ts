/**
 * Chave de IDENTIDADE do cliente — compartilhada por clientes e relatórios.
 *
 * Um cliente pertence SEMPRE a uma loja (a chave é agrupada por dentro de
 * cada store — nunca há identidade global entre lojistas). O sinal é o
 * telefone do formulário de checkout (obrigatório: sem telefone não há
 * encomenda), normalizado para só dígitos — `+258 84 123 456` e
 * `84-123-456` escrevem-se de formas diferentes mas, se os dígitos forem
 * distintos (prefixo do país presente/ausente), são chaves distintas: sem
 * fuzzy matching por nome/localização, tal como decidido na auditoria.
 *
 * Este módulo não importa nada (sem ciclos): `customers/aggregate` e
 * `reports/aggregate` partilham EXATAMENTE a mesma regra.
 */

/** Telefone → chave estável: só dígitos (formatação não divide clientes). */
export function customerKey(phone: string): string {
  const digits = String(phone).replace(/\D+/g, "");
  if (digits.length > 0) return digits;
  // Fallback raro (telefone sem dígitos): trecho URL-seguro, nunca vazio.
  const fallback = String(phone)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return fallback.length > 0 ? fallback : "sem-telefone";
}
