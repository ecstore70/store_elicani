/**
 * Resolução hostname → slug de loja.
 *
 * Prepara o roteamento de "{store-slug}.elicani.site" sem amarrar a nenhum
 * lojista específico. O proxy (src/proxy.ts) usa extractStoreSlug() para
 * reescrever a raiz do subdomínio para /store/[slug].
 *
 * Nada aqui é hardcoded: o domínio base vem de NEXT_PUBLIC_STORE_DOMAIN.
 */
import { isReservedSlug, validateSlug } from "./slug.ts";

const DEFAULT_STORE_DOMAIN = "elicani.site";

/** Domínio base das lojas públicas (ex.: elicani.site, localhost). */
export function getStoreDomain(): string {
  return (process.env.NEXT_PUBLIC_STORE_DOMAIN ?? DEFAULT_STORE_DOMAIN)
    .trim()
    .toLowerCase();
}

function stripPort(host: string): string {
  // IPv6 literal: [::1]:3000
  if (host.startsWith("[")) {
    const end = host.indexOf("]");
    return end === -1 ? host.toLowerCase() : host.slice(0, end + 1).toLowerCase();
  }
  return host.split(":")[0].toLowerCase();
}

/**
 * Extrai o slug de loja de um hostname.
 *
 *  maria-fashion.elicani.site  → "maria-fashion"
 *  app.elicani.site            → null  (reservado)
 *  www.elicani.site            → null  (reservado)
 *  elicani.site                → null  (apex)
 *  outro.site                  → null  (domínio alheio)
 *  api.elicani.site            → null  (reservado)
 *  a.b.elicani.site            → null  (subdomínio aninhado)
 */
export function extractStoreSlug(
  host: string | null | undefined,
  domain: string = getStoreDomain(),
): string | null {
  if (!host) return null;

  const base = stripPort(domain.trim());
  const clean = stripPort(host.trim()).replace(/\.$/, "");

  if (!base || !clean) return null;
  if (clean === base) return null; // apex
  if (clean.length <= base.length + 1) return null;
  if (!clean.endsWith(`.${base}`)) return null;

  const subdomain = clean.slice(0, -(base.length + 1));

  if (subdomain.includes(".")) return null; // aninhado
  if (isReservedSlug(subdomain)) return null;
  if (validateSlug(subdomain) !== null) return null;

  return subdomain;
}

/** URL pública de uma loja. */
export function storePublicUrl(
  slug: string,
  domain: string = getStoreDomain(),
): string {
  const scheme = domain === "localhost" ? "http" : "https";
  return `${scheme}://${slug}.${domain}`;
}
