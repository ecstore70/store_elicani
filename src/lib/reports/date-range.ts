/**
 * Resolução de PERÍODOS dos relatórios — PURA e testável.
 *
 * O painel escolhe um período (ou um intervalo personalizado) e a página
 * do servidor resolve-o para um intervalo de instantes [from, to) +
 * as chaves de dia LOCAL correspondentes. Nada aqui lê a base nem a data
 * do sistema sem a receber como parâmetro — os testes fixam `now`.
 *
 * Fuso horário: usa o fuso CONFIGURADO NA LOJA (`stores.timezone`, coluna
 * já existente) quando existe e é um IANA válido; caso contrário cai em
 * UTC. "Hoje" do lojista é o dia LOCAL da loja — nunca uma data fixa.
 *
 * Personalizado: chaves `YYYY-MM-DD` interpretadas na meia-noite LOCAL do
 * fuso (limitado a 366 dias; intervalo invertido é corrigido).
 */

export type RangePreset =
  | "today"
  | "yesterday"
  | "last7"
  | "last30"
  | "this_month"
  | "prev_month";

export const RANGE_PRESETS = [
  "today",
  "yesterday",
  "last7",
  "last30",
  "this_month",
  "prev_month",
] as const satisfies readonly RangePreset[];

export type ReportRange = {
  /** Inclusão inicial (instante ISO). */
  from: string;
  /** Limite EXCLUSIVO (instante ISO). */
  to: string;
  /** Chave de dia local do primeiro dia (YYYY-MM-DD). */
  fromKey: string;
  /** Número de dias cobertos (>= 1). */
  days: number;
  /** Preset ativo, ou "custom". */
  preset: RangePreset | "custom";
};

export type RangeParams = {
  range?: string | string[];
  from?: string | string[];
  to?: string | string[];
};

const DAY_MS = 86_400_000;
const MAX_DAYS = 366;
const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Primeiro valor quando o parâmetro veio duplicado na query string. */
function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

/** IANA válido para o `Intl`; cai em UTC quando o valor é inexistente. */
export function safeTimeZone(timeZone: string | null | undefined): string {
  if (!timeZone) return "UTC";
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return timeZone;
  } catch {
    return "UTC";
  }
}

function partsFormatter(timeZone: string): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
}

/** Deslocamento (ms) do fuso em relação ao UTC num instante dado. */
function offsetMs(instant: number, timeZone: string): number {
  const parts = partsFormatter(timeZone).formatToParts(new Date(instant));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? "0");
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );
  return asUtc - instant;
}

/** Chave de dia LOCAL (YYYY-MM-DD) de um instante no fuso dado. */
export function dateKeyOf(instant: number, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(instant));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** Soma dias a uma chave de dia (aritmética de calendário pura). */
export function addDays(dateKey: string, days: number): string {
  const base = Date.parse(`${dateKey}T00:00:00Z`);
  return dateKeyOf(base + days * DAY_MS, "UTC");
}

/**
 * Instante da meia-noite LOCAL do dia indicado no fuso dado.
 * Adivinha pelo deslocamento do instante "como UTC" e corrige uma vez
 * (borda de horário de verão).
 */
export function midnightOf(dateKey: string, timeZone: string): Date {
  const asIfUtc = Date.parse(`${dateKey}T00:00:00Z`);
  const offset1 = offsetMs(asIfUtc, timeZone);
  let instant = asIfUtc - offset1;
  const offset2 = offsetMs(instant, timeZone);
  if (offset2 !== offset1) instant = asIfUtc - offset2;
  return new Date(instant);
}

/** Chave de dia válida (formato + data real no calendário). */
function isDateKey(value: string | undefined): value is string {
  if (!value || !DATE_KEY_RE.test(value)) return false;
  const parsed = Date.parse(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed)) return false;
  // Rejeita 2026-02-31 (o parse normaliza para 2026-03-03).
  return dateKeyOf(parsed, "UTC") === value;
}

/** Dias entre duas chaves (a segunda exclusa). */
function daysBetween(fromKey: string, toKeyExclusive: string): number {
  return Math.round(
    (Date.parse(`${toKeyExclusive}T00:00:00Z`) - Date.parse(`${fromKey}T00:00:00Z`)) /
      DAY_MS,
  );
}

function buildRange(
  fromKey: string,
  toKeyExclusive: string,
  preset: ReportRange["preset"],
  timeZone: string,
): ReportRange {
  return {
    from: midnightOf(fromKey, timeZone).toISOString(),
    to: midnightOf(toKeyExclusive, timeZone).toISOString(),
    fromKey,
    days: Math.max(1, daysBetween(fromKey, toKeyExclusive)),
    preset,
  };
}

/**
 * Resolve os parâmetros da query num período fechado.
 *
 * Prioridade: intervalo personalizado válido → preset conhecido → últimos
 * 30 dias. Nunca lança: entradas inválidas caem num período válido.
 */
export function resolveRange(
  params: RangeParams,
  now: Date,
  timeZone: string,
): ReportRange {
  const tz = safeTimeZone(timeZone);
  const todayKey = dateKeyOf(now.getTime(), tz);

  // ── personalizado ──────────────────────────────────────────────────────
  const fromKey = first(params.from);
  const toKey = first(params.to);
  if (isDateKey(fromKey) && isDateKey(toKey)) {
    // Intervalo invertido → corrigido; excesso de 366 dias → truncado.
    const [start, end] =
      fromKey <= toKey ? [fromKey, toKey] : [toKey, fromKey];
    const cappedStart =
      daysBetween(start, addDays(end, 1)) > MAX_DAYS
        ? addDays(end, -(MAX_DAYS - 1))
        : start;
    return buildRange(cappedStart, addDays(end, 1), "custom", tz);
  }

  // ── presets ────────────────────────────────────────────────────────────
  const preset = RANGE_PRESETS.find((key) => key === first(params.range));
  switch (preset) {
    case "today":
      return buildRange(todayKey, addDays(todayKey, 1), "today", tz);
    case "yesterday": {
      const yesterday = addDays(todayKey, -1);
      return buildRange(yesterday, todayKey, "yesterday", tz);
    }
    case "last7":
      return buildRange(
        addDays(todayKey, -6),
        addDays(todayKey, 1),
        "last7",
        tz,
      );
    case "last30":
      return buildRange(
        addDays(todayKey, -29),
        addDays(todayKey, 1),
        "last30",
        tz,
      );
    case "this_month": {
      const firstOfMonth = `${todayKey.slice(0, 8)}01`;
      return buildRange(
        firstOfMonth,
        addDays(todayKey, 1),
        "this_month",
        tz,
      );
    }
    case "prev_month": {
      const firstOfMonth = `${todayKey.slice(0, 8)}01`;
      const lastOfPrev = addDays(firstOfMonth, -1);
      const firstOfPrev = `${lastOfPrev.slice(0, 8)}01`;
      return buildRange(firstOfPrev, firstOfMonth, "prev_month", tz);
    }
    default:
      return buildRange(
        addDays(todayKey, -29),
        addDays(todayKey, 1),
        "last30",
        tz,
      );
  }
}
