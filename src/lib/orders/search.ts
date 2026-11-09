/**
 * Utilitários PUROS de pesquisa de encomendas (testáveis sem rede/DB).
 *
 * A pesquisa usa filtros `.or()` do PostgREST
 * (`reference.ilike.X*,customer_name.ilike.*X*,customer_phone.ilike.*X*`),
 * em que `*` é o curinga. Por isso o termo é higienizado aqui:
 *   • remove separadores do `.or()` (`,`, `(`, `)`) e curingas (`*`, `%`);
 *   • colapsa espaços e aparas as pontas;
 *   • limita o comprimento (evita URLs absurdas).
 * Termo vazio → "" (a consulta ignora o filtro de texto).
 */
export const SEARCH_MAX = 60;

export function sanitizeSearchTerm(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw
    .replace(/[,%()*]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, SEARCH_MAX);
}

/** UUID canónico — evita erro 400 do PostgREST em rotas dinâmicas. */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

/** Estados válidos de encomenda (constraint da base de dados). */
export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export function isOrderStatus(value: unknown): value is OrderStatus {
  return (
    typeof value === "string" &&
    (ORDER_STATUSES as readonly string[]).includes(value)
  );
}
