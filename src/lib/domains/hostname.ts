/**
 * Normalização e validação de hostname de DOMÍNIO PRÓPRIO (Custom Domains).
 *
 * Um lojista pode apontar um domínio que ele próprio registrou (ex.:
 * "loja.com") para a sua loja. Este módulo é a ÚNICA porta de entrada de
 * um hostname vindo do exterior (formulário, API, header Host) — roda no
 * SERVIDOR (testes incluídos) e devolve sempre um resultado estruturado:
 * ou o hostname normalizado, ou o problema exato.
 *
 * Regras de normalização (ordem importa):
 *   1. trim + minúsculas;
 *   2. rejeita protocolo (https://…), caminho/consulta/fragmento
 *      (/ ? #), porta (:3000), IP literal (v4/v6), curinga (*),
 *      localhost, hostnames da PLATAFORMA (*.elicani.site + apex);
 *   3. remove UM ponto final (forma FQDN) — como o resolver já faz;
 *   4. converte IDN para punycode (domainToASCII) e valida labels DNS:
 *      1–63 chars, [a-z0-9-] sem hífen inicial/final, total ≤ 253.
 *
 * Módulo puro (sem Next/React) e sem estado. As mensagens de erro vivem no
 * catálogo i18n: aqui guardamos apenas a CHAVE correspondente a cada
 * problema — mesmo padrão de src/lib/stores/slug.ts.
 *
 * Fase 1: este módulo é a camada de dados/validação. NADA aqui altera
 * roteamento, proxy, Vercel ou a vitrine — consumidores entram nas fases
 * seguintes.
 */
import { domainToASCII } from "node:url";
import type { MessageKey } from "@/lib/i18n/messages/en.ts";

/** Comprimento máximo de um hostname (RFC 1035, sem o ponto final). */
export const HOSTNAME_MAX_LENGTH = 253;
/** Comprimento máximo de um label (RFC 1035). */
export const HOSTNAME_LABEL_MAX_LENGTH = 63;

/**
 * Base de domínio da própria plataforma. NUNCA pode ser domínio de loja:
 * cobre o apex, www/app e TODO o wildcard `{slug}.elicani.site`.
 * (Inspecionado no repositório: proxy.ts, resolve.ts e env.ts usam
 * exclusivamente elicani.site.)
 */
export const PLATFORM_BASE_DOMAIN = "elicani.site";

/**
 * É um hostname da plataforma (apex ou subdomínio de elicani.site)?
 * Aceita variações de caixa, espaços nas pontas e ponto final (FQDN).
 */
export function isPlatformHostname(hostname: string): boolean {
  let value = hostname.trim().toLowerCase();
  if (value.endsWith(".")) value = value.slice(0, -1);
  return (
    value === PLATFORM_BASE_DOMAIN ||
    value.endsWith(`.${PLATFORM_BASE_DOMAIN}`)
  );
}

export type HostnameProblem =
  | "empty"
  | "protocol"
  | "path"
  | "ip"
  | "port"
  | "wildcard"
  | "localhost"
  | "platform"
  | "too_long"
  | "invalid";

/** Chave i18n de cada problema, para a action traduzir. */
export const HOSTNAME_MESSAGE_KEYS: Record<HostnameProblem, MessageKey> = {
  empty: "store.error.hostnameEmpty",
  protocol: "store.error.hostnameProtocol",
  path: "store.error.hostnamePath",
  ip: "store.error.hostnameIp",
  port: "store.error.hostnamePort",
  wildcard: "store.error.hostnameWildcard",
  localhost: "store.error.hostnameLocalhost",
  platform: "store.error.hostnamePlatform",
  too_long: "store.error.hostnameTooLong",
  invalid: "store.error.hostnameInvalid",
};

export type HostnameResult =
  | { ok: true; hostname: string }
  | { ok: false; problem: HostnameProblem };

/** Qualquer esquema com "://" — https://, ftp://, mail://… */
const SCHEME_PATTERN = /^[a-z][a-z0-9+.-]*:\/\//;
/** Separadores que só existem em URL, nunca em hostname puro. */
const URL_DELIMITER_PATTERN = /[/?#]/;
/** IPv4 literal (grupos 0-255 não é checado aqui: rejeitar é o que importa). */
const IPV4_PATTERN = /^\d{1,3}(\.\d{1,3}){3}$/;
/** IPv6 (com ou sem colchetes): só hex, pontos, dois-pontos e colchetes. */
const IPV6_LIKE_PATTERN = /^\[?[0-9a-f:.]+\]?$/;
/** Label DNS válido após punycode (RFC 1035 / 1123). */
const LABEL_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

function fail(problem: HostnameProblem): HostnameResult {
  return { ok: false, problem };
}

/**
 * Normaliza um hostname de domínio próprio.
 *
 *   "  LojaMaison.COM. "  → { ok: true,  hostname: "lojamaison.com" }
 *   "https://loja.com/x"  → { ok: false, problem: "protocol" }
 *   "app.elicani.site"    → { ok: false, problem: "platform" }
 *
 * O resultado NUNCA contém protocolo, porta, caminho, ponto final nem
 * caixa mista — é exatamente o formato aceito pelo banco (CHECK de
 * store_domains) e comparável com igualdade exata.
 */
export function normalizeHostname(input: string): HostnameResult {
  const raw = input.trim();
  if (raw.length === 0) return fail("empty");

  const lower = raw.toLowerCase();

  // 1. Coisas que pertencem a uma URL, não a um hostname.
  if (SCHEME_PATTERN.test(lower) || lower.includes("://")) {
    return fail("protocol");
  }
  if (URL_DELIMITER_PATTERN.test(lower)) return fail("path");

  // 2. IP literal antes da regra de porta — IPv6 também contém ':'.
  if (IPV4_PATTERN.test(lower)) return fail("ip");
  if (lower.includes(":")) {
    if (IPV6_LIKE_PATTERN.test(lower) && lower.split(":").length > 2) {
      return fail("ip");
    }
    return fail("port");
  }

  // 3. Ponto final (FQDN): remove UM; vazio após remover → vazio.
  const host = lower.endsWith(".") ? lower.slice(0, -1) : lower;
  if (host.length === 0) return fail("empty");

  // 4. Curinga, localhost e hostnames da plataforma.
  if (host.includes("*")) return fail("wildcard");
  if (host === "localhost" || host.endsWith(".localhost")) {
    return fail("localhost");
  }
  if (isPlatformHostname(host)) return fail("platform");

  // 5. Comprimento total (antes e depois do punycode, que só cresce).
  if (host.length > HOSTNAME_MAX_LENGTH) return fail("too_long");

  // 6. Punycode (IDN) — "" significa entrada não convertible.
  const ascii = domainToASCII(host);
  if (ascii.length === 0) return fail("invalid");
  if (ascii.length > HOSTNAME_MAX_LENGTH) return fail("too_long");

  // 7. Labels DNS: vazio (ex.: "a..b"), longo demais ou com caracteres
  //    proibidos (underscore,asterisco, hífen inicial/final, "!"…).
  //    Mínimo de DOIS labels: label único ("intranet") nunca é um domínio
  //    público registrado — fail-closed.
  const labels = ascii.split(".");
  if (labels.length < 2) return fail("invalid");
  for (const label of labels) {
    if (label.length === 0) return fail("invalid");
    if (label.length > HOSTNAME_LABEL_MAX_LENGTH) return fail("too_long");
    if (!LABEL_PATTERN.test(label)) return fail("invalid");
  }

  return { ok: true, hostname: ascii };
}

/** Só o problema (ou null se válido) — espelho de validateSlug. */
export function validateHostname(input: string): HostnameProblem | null {
  const result = normalizeHostname(input);
  return result.ok ? null : result.problem;
}
