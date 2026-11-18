/**
 * Geometria dos SELOS do rodapé — puro, sem React nem DOM.
 *
 * Um selo é um desenho circular 100×100 (viewBox):
 *
 *   • borda em ROSETA (picotes arredondados gerados por fórmula — a
 *     silhueta que lê como "selo de qualidade", não como círculo com
 *     borda);
 *   • dois anéis concêntricos + disco central com tinta fraca do tema;
 *   • tipografia circular da marca (ELICANI em dous arcos — topo e base,
 *     sempre na horizontal, nunca de cabeça para baixo);
 *   • mensagem central em 1–3 linhas maiúsculas + pontinhos decorativos.
 *
 * O ponto crítico é LEGIBILIDADE EM QUALQUER IDIOMA: o texto tem de
 * caber DENTRO do círculo (raio seguro `R_TEXT`) sem tocar os anéis —
 * inclusive com traduções longas. Por isso o tamanho da fonte é
 * RESOLVIDO por iteração: a maior fonte (≤ `FS_MAX`) cujas linhas cabem
 * na moldura. O teste `seal-layout.test.ts` exige `fs ≥ 10` em todos os
 * 9 idiomas: quando uma palavra não cabe, o teste falha e o TEXTO é
 * encurtado — a moldura nunca estoura e a letra nunca vira ilegível.
 *
 * Cores ficam de fora de propósito: o componente usa as variáveis do
 * tema (`--sf-primary`, `--sf-fg`), então o selo se adapta a qualquer
 * aparência do comerciante.
 */

/** Centro do viewBox 100×100. */
const CENTER = 50;
/** Raio "seguro" para o texto central (disco 33.2, fio 34.8). */
export const R_TEXT = 33;
/** Tamanho máximo da fonte da mensagem central (unidades do viewBox). */
export const FS_MAX = 13;
/** Contrato de legibilidade — o teste exige ≥ 10 em todos os idiomas. */
export const SEAL_FS_READABLE = 10;
/** Raio dos pontinhos decorativos sob a mensagem. */
export const DOT_R = 1.1;

// ── largura estimada das letras ───────────────────────────────────────────
/**
 * Largura de um caractere em "unidades de fonte" (fração de `fs`).
 * Heurística para maiúsculas em bold com tracking 0.06em: latinos ≈ 0.66,
 * árabes (script ligado) ≈ 0.55, CJK/fullwidth ≈ 1.05 (glifos quadrados).
 * O teste de idiomas é quem garante que a estimativa basta na prática.
 */
function charWidth(ch: string): number {
  if (ch === " ") return 0.36;
  const code = ch.codePointAt(0) ?? 0;
  if (code === 0x2d) return 0.42; // hífen
  if (code === 0x2022) return 0.5; // marcador "•"
  if (
    (code >= 0x1100 && code <= 0x11ff) || // hangul
    (code >= 0x2e80 && code <= 0x9fff) || // CJK, kana
    (code >= 0xac00 && code <= 0xd7af) ||
    (code >= 0xf900 && code <= 0xfaff) ||
    (code >= 0xff00 && code <= 0xffef) // fullwidth
  ) {
    return 1.05;
  }
  if (code >= 0x0600 && code <= 0x06ff) return 0.55; // árabe
  return 0.66;
}

/** Largura total do texto em unidades de fonte (soma das letras). */
export function textWidthUnits(text: string): number {
  let units = 0;
  for (const ch of text) units += charWidth(ch);
  return units;
}

// ── quebra em linhas ──────────────────────────────────────────────────────
/** Junta tokens sem deixar espaço depois de hífen ("ONLINE- KATALOG"). */
function joinTokens(tokens: string[]): string {
  return tokens.reduce((a, b) => (a.endsWith("-") ? a + b : `${a} ${b}`));
}

/**
 * Divide o texto em 1–3 linhas centradas:
 *  • maiúsculas (medidas do jeito que são renderizadas);
 *  • quebra por palavra e DEPOIS de hífen (alemão "ONLINE-KATALOG"
 *    vira ONLINE- / KATALOG sem inventar palavra);
 *  • 4+ palavras → duas linhas equilibradas (nunca mais de 3 linhas);
 *  • CJK sem espaços é tratado pelo fallback de `layoutSeal`.
 */
export function splitSealLines(rawText: string): string[] {
  const text = rawText.toUpperCase().trim();
  const words = text
    .split(/\s+/)
    .flatMap((word) => word.split(/(?<=-)/))
    .filter(Boolean);
  if (words.length === 0) return [text];
  if (words.length <= 3) return words;
  const mid = Math.ceil(words.length / 2);
  return [joinTokens(words.slice(0, mid)), joinTokens(words.slice(mid))];
}

// ── posicionamento vertical ───────────────────────────────────────────────
type Placement = { capTops: number[]; baselines: number[]; dotsY: number };

/**
 * Compõe as linhas + pontinhos centralizados no círculo: a altura
 * TOTAL (topo das caps → base dos pontinhos) fica centrada em `CENTER`,
 * com entrelinha de 1.18·fs e folga de 0.75·fs antes dos pontinhos.
 */
function place(n: number, fs: number): Placement {
  const cap = 0.72 * fs;
  const lineH = 1.18 * fs;
  const dotsGap = 0.75 * fs;
  const totalH = cap + (n - 1) * lineH + dotsGap + DOT_R;
  const capTop1 = CENTER - totalH / 2;
  const baselines = Array.from({ length: n }, (_, i) => capTop1 + cap + i * lineH);
  const capTops = baselines.map((b) => b - cap);
  const dotsY = baselines[n - 1] + dotsGap;
  return { capTops, baselines, dotsY };
}

/**
 * Largura máxima disponível para a linha `line`, dada a posição atual:
 * a corda do círculo de raio `R_TEXT` na altura do canto mais extremo
 * da linha (topo das caps ou baseline — o que estiver mais longe do
 * centro). Garante que NENhum canto de texto ultrapasse o raio seguro.
 */
function budgetFor(pos: Placement, line: number): number {
  const dy = Math.max(
    Math.abs(pos.capTops[line] - CENTER),
    Math.abs(pos.baselines[line] - CENTER),
  );
  if (dy >= R_TEXT) return 0;
  return 2 * Math.sqrt(R_TEXT * R_TEXT - dy * dy);
}

// ── solução principal ─────────────────────────────────────────────────────
export type SealLayout = {
  lines: string[];
  /** Fonte da mensagem central (≤ FS_MAX, ≥ 10 garantido pelo teste). */
  fs: number;
  baselines: number[];
  dotsY: number;
};

/**
 * Resolve o layout do selo para um texto. A fonte nasce em `FS_MAX` e é
 * rebaixada (com amortecimento — a função é decrescente e oscilaria) até
 * o ponto fixo em que todas as linhas cabem na moldura.
 *
 * Fallback: linha única sem espaços grande demais (ex.: japonês) →
 * quebra no MEIO (em CJK a quebra é natural; nenhuma das traduções
 * suportadas cai no caso de palavra latina partida — o teste garante).
 */
export function layoutSeal(rawText: string): SealLayout {
  let lines = splitSealLines(rawText);

  if (lines.length === 1) {
    const caps = textWidthUnits(lines[0]);
    if (caps * FS_MAX > budgetFor(place(1, FS_MAX), 0)) {
      // teto (não piso): 9 chars → 5+4, que nas palavras japonesas
      // suportadas cai exatamente na fronteira (オンライン | カタログ)
      const mid = Math.ceil(lines[0].length / 2);
      lines = [lines[0].slice(0, mid), lines[0].slice(mid)].filter(
        (part) => part.length > 0,
      );
    }
  }

  const caps = lines.map(textWidthUnits);
  let fs = FS_MAX;
  for (let i = 0; i < 32; i++) {
    const pos = place(lines.length, fs);
    const fNew = Math.min(
      FS_MAX,
      ...lines.map((_, line) => budgetFor(pos, line) / caps[line]),
    );
    if (Math.abs(fNew - fs) < 0.01) {
      fs = fNew;
      break;
    }
    fs = (fs + fNew) / 2; // amortecido: evita oscilação no ponto fixo
  }

  const { baselines, dotsY } = place(lines.length, fs);
  return { lines, fs, baselines, dotsY };
}

// ── borda em roseta ───────────────────────────────────────────────────────
/**
 * Silhueta serrilhada (roseta): `scallops` picotes arredondados em volta
 * do círculo de raio `r`. Cada picote é um arco de raio 1.6× a meia
 * corda (bulbo raso, ~1.8 unidades para fora — a borda termina em
 * ≈48.3, sempre dentro do viewBox 100).
 */
export function rosettePath(r = 46.5, scallops = 28): string {
  const step = (Math.PI * 2) / scallops;
  const arcR = r * Math.sin(step / 2) * 1.6;
  const point = (i: number): [number, number] => {
    const angle = -Math.PI / 2 + i * step;
    return [CENTER + r * Math.cos(angle), CENTER + r * Math.sin(angle)];
  };
  const fmt = (p: [number, number]) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`;
  let d = `M ${fmt(point(0))}`;
  for (let i = 1; i <= scallops; i++) {
    d += ` A ${arcR.toFixed(2)} ${arcR.toFixed(2)} 0 0 1 ${fmt(point(i))}`;
  }
  return `${d} Z`;
}

/** Borda pronta (calculada uma vez no import). */
export const ROSETTE_PATH = rosettePath();

// ── tipografia circular da marca ──────────────────────────────────────────
/** Texto da marca nos arcos (nome da plataforma — não se traduz). */
export const RING_TEXT = "ELICANI";

/**
 * Arcos de topo e de base. O de cima nasce em 9h e vai por 12h até 3h
 * (sentido horário → letras horizontais, "para cima" = para fora); o de
 * baixo vai de 7h30 até 4h30 em sentido ANTI-horário → nas 6h o
 * deslocamento é para a direita, letras de cabeça para cima com os topos
 * voltados para o centro (convenção de moeda/selo).
 *
 * Raios distintos (35.4 / 39.1) mas a MESMA faixa visual ≈ [35.4, 39.1]:
 * no topo a letra cresce para fora a partir da baseline; na base, para
 * dentro a partir dela.
 */
const TOP_R = 35.4;
const BOT_R = 39.1;
const BOT_D = BOT_R * Math.SQRT1_2; // deslocamento dos extremos (45°)

export const TOP_ARC_PATH =
  `M ${(CENTER - TOP_R).toFixed(2)} ${CENTER} A ${TOP_R} ${TOP_R} 0 0 1 ` +
  `${(CENTER + TOP_R).toFixed(2)} ${CENTER}`;

export const BOTTOM_ARC_PATH =
  `M ${(CENTER - BOT_D).toFixed(2)} ${(CENTER + BOT_D).toFixed(2)} ` +
  `A ${BOT_R} ${BOT_R} 0 0 0 ` +
  `${(CENTER + BOT_D).toFixed(2)} ${(CENTER + BOT_D).toFixed(2)}`;

/**
 * Id de SVG determinístico por texto (os arcos precisam de `id` único;
 * o rodapé tem três selos e o SSR tem de bater com o CSR — nada de
 * `useId` em componente de servidor).
 */
export function sealArcId(text: string): string {
  let hash = 5381;
  for (const ch of text) {
    hash = ((hash << 5) + hash + (ch.codePointAt(0) ?? 0)) >>> 0;
  }
  return `sf-seal-${hash.toString(36)}`;
}
