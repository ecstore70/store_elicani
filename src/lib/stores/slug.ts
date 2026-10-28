/**
 * Regras de slug de loja.
 *
 * O slug vira o subdomínio público: {slug}.elicani.site
 * Portanto: apenas letras minúsculas, números e hífens — nunca espaços
 * nem caracteres especiais (quebrariam o hostname).
 *
 * Este módulo é puro (sem Next/React) e roda no cliente, no servidor e
 * nos testes. As mensagens de erro vivem no catálogo i18n: aqui guardamos
 * apenas a CHAVE correspondente a cada problema.
 */
import type { MessageKey } from "@/lib/i18n/messages/en.ts";

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const SLUG_MIN_LENGTH = 3;
/** Limite de um label de domínio (RFC 1035). */
export const SLUG_MAX_LENGTH = 63;

/**
 * Subdomínios reservados — nunca podem ser usados por lojas.
 * Para reservar outro, basta adicionar a string nesta lista.
 */
export const RESERVED_SLUGS: readonly string[] = [
  // rotas do próprio produto
  "app",
  "www",
  "admin",
  "api",
  "store",
  "stores",
  "dashboard",
  "login",
  "signup",
  "logout",
  "auth",
  "settings",
  "support",
  "help",
  "docs",
  "status",
  "blog",
  "legal",
  "about",
  "contact",
  "terms",
  "privacy",
  "careers",
  "press",
  "news",
  // infraestrutura
  "mail",
  "email",
  "cdn",
  "static",
  "assets",
  "media",
  "files",
  "portal",
  "panel",
  "billing",
  "payments",
  "pricing",
  "shop",
  "cart",
  "checkout",
  "orders",
  "products",
  "customers",
  "dev",
  "staging",
  "test",
  "sandbox",
  "ns",
  "ftp",
  "smtp",
  "imap",
  "pop",
  "webmail",
];

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.includes(slug.trim().toLowerCase());
}

export type SlugProblem =
  | "empty"
  | "invalid"
  | "too_short"
  | "too_long"
  | "reserved";

/** Chave i18n de cada problema, para a action traduzir. */
export const SLUG_MESSAGE_KEYS: Record<SlugProblem, MessageKey> = {
  empty: "store.error.slugEmpty",
  invalid: "store.error.slugInvalid",
  too_short: "store.error.slugTooShort",
  too_long: "store.error.slugTooLong",
  reserved: "store.error.slugReserved",
};

/** Valida um slug já normalizado. Retorna o problema ou null se válido. */
export function validateSlug(slug: string): SlugProblem | null {
  const value = slug.trim();

  if (value.length === 0) return "empty";
  if (value.length < SLUG_MIN_LENGTH) return "too_short";
  if (value.length > SLUG_MAX_LENGTH) return "too_long";
  if (!SLUG_PATTERN.test(value)) return "invalid";
  if (isReservedSlug(value)) return "reserved";

  return null;
}

/**
 * Gera um slug a partir de um nome.
 * "Maria Fashion"  → "maria-fashion"
 * "Café & Filhos"  → "cafe-filhos"
 */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, SLUG_MAX_LENGTH)
    .replace(/-+$/g, "");
}
