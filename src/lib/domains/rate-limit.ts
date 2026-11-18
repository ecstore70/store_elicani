/**
 * Limite de tentativas em memória por processo (Fase 2 §10).
 *
 * O repositório não tem Redis nem infraestrutura de rate limiting — a
 * única referência é o rate-limit do provedor de auth. Esta guarda é
 * propositalmente simples: janela deslizante por chave (usuário), sem
 * dependência nova. Limite por processo de servidor; em múltiplas
 * instâncias cada processo tem a sua janela — aceitável para uma guarda
 * de abuso, não para segurança de dados (o RLS é quem garante isso).
 */

export type RateGate = {
  /** true se pode executar agora; false se excedeu o limite da janela. */
  check(key: string): boolean;
};

export function createRateGate(options: {
  /** Máximo de eventos por janela, por chave. */
  limit: number;
  /** Tamanho da janela deslizante, em milissegundos. */
  windowMs: number;
  /** Relógio injetável para teste. */
  now?: () => number;
}): RateGate {
  const now = options.now ?? Date.now;
  const hits = new Map<string, number[]>();

  return {
    check(key: string): boolean {
      const current = now();
      const windowStart = current - options.windowMs;
      // Janela deslizante: descarta fora do tempo a cada chamada.
      const recent = (hits.get(key) ?? []).filter((ts) => ts > windowStart);
      if (recent.length >= options.limit) {
        hits.set(key, recent);
        return false;
      }
      recent.push(current);
      hits.set(key, recent);
      return true;
    },
  };
}
