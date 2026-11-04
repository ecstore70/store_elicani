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

/**
 * Subconjunto EXPLÍCITO de RESERVED_SLUGS que o dono da plataforma pode
 * registrar como loja (exceção controlada).
 *
 * "shop" continua DENTRO de RESERVED_SLUGS — lojistas comuns continuam
 * recebendo "store.error.slugReserved". A exceção é estreita de propósito:
 * NÃO cobre os demais reservados (app, admin, api, ...) — esses continuam
 * proibidos para todos, incluindo o próprio dono da plataforma.
 */
export const PLATFORM_OWNER_RESERVED_SLUGS: readonly string[] = ["shop"];

export function isPlatformOwnerSlugException(slug: string): boolean {
  return PLATFORM_OWNER_RESERVED_SLUGS.includes(slug.trim().toLowerCase());
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

/** Valida só o FORMATO (comprimento + padrão), sem a regra de reservados. */
export function validateSlugFormat(slug: string): SlugProblem | null {
  const value = slug.trim();

  if (value.length === 0) return "empty";
  if (value.length < SLUG_MIN_LENGTH) return "too_short";
  if (value.length > SLUG_MAX_LENGTH) return "too_long";
  if (!SLUG_PATTERN.test(value)) return "invalid";

  return null;
}

/** Valida um slug já normalizado. Retorna o problema ou null se válido. */
export function validateSlug(slug: string): SlugProblem | null {
  const problem = validateSlugFormat(slug);
  if (problem) return problem;
  if (isReservedSlug(slug)) return "reserved";

  return null;
}

/**
 * Valida slug no fluxo de CRIAÇÃO de loja, aplicando a exceção do dono
 * da plataforma (PLATFORM_OWNER_RESERVED_SLUGS).
 *
 * `isPlatformOwner` é informado SOMENTE pelo servidor, derivado do token
 * validado (auth.getUser → app_metadata). Nunca vem do formulário.
 */
export function validateSlugForCreation(
  slug: string,
  isPlatformOwner: boolean,
): SlugProblem | null {
  const problem = validateSlug(slug);
  if (
    problem === "reserved" &&
    isPlatformOwner &&
    isPlatformOwnerSlugException(slug)
  ) {
    return null;
  }
  return problem;
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
