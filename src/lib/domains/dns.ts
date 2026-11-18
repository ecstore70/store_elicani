import "server-only";

import { promises as dnsPromises } from "node:dns";
import {
  classifyDnsError,
  interpretDnsAnswer,
  type DnsTxtResult,
} from "./verify";

/**
 * Consulta DNS TXT defensiva (Fase 2 §9) — só este módulo fala com a
 * rede, e é `server-only`: o browser nunca importa `node:dns`.
 *
 * Limites: timeout por consulta + NENHUM retry (teto duro de ~2s),
 * apenas registros TXT (nunca HTTP, nunca redirecionamentos, nunca
 * varredura recursiva — o nome vem do hostname normalizado do banco).
 * O runtime é o Node padrão das server actions do App Router; nada é
 * forçado para o runtime de edge.
 */
const DNS_TIMEOUT_MS = 2000;
const DNS_TRIES = 1;

/** Resolve TXT com timeout limitado e classifica o resultado (nunca lança). */
export async function resolveTxt(name: string): Promise<DnsTxtResult> {
  const resolver = new dnsPromises.Resolver({
    timeout: DNS_TIMEOUT_MS,
    tries: DNS_TRIES,
  });
  try {
    return interpretDnsAnswer(await resolver.resolveTxt(name));
  } catch (error) {
    return { ok: false, reason: classifyDnsError(error) };
  }
}
