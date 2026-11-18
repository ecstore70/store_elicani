/**
 * Núcleo PURO da verificação de propriedade por DNS TXT (Fase 2).
 *
 * Nada aqui rede, nem `node:dns`, nem `server-only` — o resolvedor real
 * vive em `dns.ts` e é injetado como função, o que permite testar todo o
 * fluxo (sucesso, token errado, registro ausente, falha temporária) com
 * um falso lookup. A action monta o nome `_elicaniverify.<hostname>`
 * a partir do hostname JÁ normalizado e armazenado no banco — nunca de
 * input cru do cliente.
 */

/** Resultado de uma consulta TXT, já classificado (nunca lança erro). */
export type DnsTxtResult =
  | { ok: true; records: string[][] }
  | { ok: false; reason: "not_found" | "temporary" };

/** Contrato do resolvedor injetado (o real está em `dns.ts`). */
export type TxtLookup = (name: string) => Promise<DnsTxtResult>;

/** Falhas de verificação — cada uma vira uma mensagem i18n distinta. */
export type VerifyFailure = "txt_missing" | "txt_mismatch" | "dns_unavailable";

export type VerifyOutcome = { ok: true } | { ok: false; failure: VerifyFailure };

/** Prefixo do registro TXT de verificação (RFC: nome exato do desafio). */
export const VERIFY_TXT_PREFIX = "_elicaniverify";

/** Nome do registro TXT para o hostname normalizado: `_elicaniverify.<host>`. */
export function buildTxtName(hostname: string): string {
  return `${VERIFY_TXT_PREFIX}.${hostname}`;
}

/**
 * Classifica um erro do resolvedor:
 *   - `not_found`   → o registro TXT não existe (NXDOMAIN/NODATA) — o
 *                     comerciante ainda não criou o registro;
 *   - `temporary`   → timeout, SERVFAIL, recusa ou erro desconhecido —
 *                     falha RETENTÁVEL, nunca marca o domínio como falho.
 * Falha em aberto para `temporary`: um problema temporário de DNS não
 * pode ser confundido com "registro inexistente".
 */
export function classifyDnsError(error: unknown): "not_found" | "temporary" {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: unknown }).code ?? "")
      : "";
  if (code === "ENOTFOUND" || code === "ENODATA" || code === "ENOTIMP") {
    return "not_found";
  }
  return "temporary";
}

/**
 * Interpreta a resposta do resolvedor: resposta vazia = sem registros TXT
 * (equivalente a NODATA), que é "não encontrado", não "mismatch".
 */
export function interpretDnsAnswer(records: string[][]): DnsTxtResult {
  return records.length > 0
    ? { ok: true, records }
    : { ok: false, reason: "not_found" };
}

/**
 * Um registro TXT corresponde quando o valor completo é igual ao token
 * OU contém o token exato (formatos como `elicaniverify=<token>`).
 *
 * O valor de um registro é a concatenação dos chunks de até 255 bytes
 * (a API do Node devolve cada registro como `string[]`). Comparação
 * EXATA e sensível a caixa: o token é gerado pelo banco em hex minúsculo.
 */
export function txtRecordMatches(records: string[][], token: string): boolean {
  if (!token) return false;
  return records.some((chunks) => {
    const value = chunks.join("");
    return value === token || value.includes(token);
  });
}

/**
 * Avalia a verificação com lookup injetado. Nunca lança: qualquer erro
 * inesperado do resolvedor vira `dns_unavailable` (retentável).
 *
 * Estados (Fase 2 §8): o domínio permanece PENDENTE em todas as falhas.
 */
export async function evaluateVerification(options: {
  lookup: TxtLookup;
  txtName: string;
  token: string;
}): Promise<VerifyOutcome> {
  let result: DnsTxtResult;
  try {
    result = await options.lookup(options.txtName);
  } catch {
    return { ok: false, failure: "dns_unavailable" };
  }

  if (!result.ok) {
    return {
      ok: false,
      failure: result.reason === "not_found" ? "txt_missing" : "dns_unavailable",
    };
  }
  if (result.records.length === 0) {
    return { ok: false, failure: "txt_missing" };
  }
  return txtRecordMatches(result.records, options.token)
    ? { ok: true }
    : { ok: false, failure: "txt_mismatch" };
}
