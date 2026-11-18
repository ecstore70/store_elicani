import type { MessageKey } from "@/lib/i18n/messages/en";
import type { VerifyFailure } from "./verify";

/**
 * Estado de formulário devolvido pelas actions de domínio — as strings já
 * vêm TRADUZIDAS do servidor (mesmo padrão de `FaqItemFormState`).
 * Vive fora de `actions.ts` porque arquivos `"use server"` só podem
 * exportar funções assíncronas.
 */
export type DomainFormState = {
  error: string | null;
  notice: string | null;
  fieldErrors: { hostname?: string };
};

export const EMPTY_DOMAIN_STATE: DomainFormState = {
  error: null,
  notice: null,
  fieldErrors: {},
};

export function domainState(patch: Partial<DomainFormState>): DomainFormState {
  return { ...EMPTY_DOMAIN_STATE, ...patch };
}

/** Linha de domínio exibida no card (somente campos do próprio lojista). */
export type DomainSummary = {
  id: string;
  hostname: string;
  status: string;
  last_error: string | null;
  verification_token: string;
  verified_at: string | null;
};

/** Código de `last_error` → chave i18n (compartilhada por action e UI). */
export const FAILURE_MESSAGE_KEYS: Record<VerifyFailure, MessageKey> = {
  txt_missing: "domains.error.txtMissing",
  txt_mismatch: "domains.error.txtMismatch",
  dns_unavailable: "domains.error.dnsUnavailable",
};
