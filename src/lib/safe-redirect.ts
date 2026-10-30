/**
 * Guarda de open redirect — compartilhada por server actions (login),
 * proxy e o callback OAuth (/auth/callback).
 *
 * Só aceita caminhos internos: começam com "/", sem "//" e sem "://".
 * Exemplos rejeitados: "//evil.com", "/\\evil.com" (não começa com "/"),
 * "https://evil.com", "//evil.com".
 */
export function isSafeInternalPath(
  value: string | null | undefined,
): value is string {
  return (
    typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("://")
  );
}

/** Resolve um valor vindo de formulário/URL para um destino interno seguro. */
export function resolveSafeNext(
  value: string | null | undefined,
  fallback = "/app",
): string {
  return isSafeInternalPath(value) ? value : fallback;
}
