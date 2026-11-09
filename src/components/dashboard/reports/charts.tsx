import { formatCurrency, formatNumber } from "@/lib/currency";
import type { Locale } from "@/lib/i18n/config";
import type { SalesPoint } from "@/lib/reports/aggregate";

/**
 * Gráficos dos relatórios — SVG desenhado à mão, SEM biblioteca nova.
 *
 * O texto dos eixos fica em HTML fora do SVG (labels sempre legíveis em
 * 320px — o `viewBox` escala o desenho, não as palavras). Sem animação,
 * sem gradiente, sem 3D: superfícies sólidas dos tokens do painel.
 */
const W = 720;
const H = 180;
const PAD_X = 4;
const PAD_Y = 6;

/** Teto "bonito" para o eixo Y (1 / 2 / 2.5 / 5 / 10 × 10^k). */
function niceMax(value: number): number {
  if (value <= 0) return 1;
  const exp = Math.floor(Math.log10(value));
  const base = 10 ** exp;
  const frac = value / base;
  const nice =
    frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 2.5 ? 2.5 : frac <= 5 ? 5 : 10;
  return nice * base;
}

/** Até 5 rótulos no eixo X, sempre incluindo o primeiro e o último dia. */
function labelIndices(length: number): number[] {
  if (length <= 5) return Array.from({ length }, (_, i) => i);
  const step = Math.ceil((length - 1) / 4);
  const indices: number[] = [];
  for (let i = 0; i < length - 1; i += step) indices.push(i);
  if (indices[indices.length - 1] !== length - 1) indices.push(length - 1);
  return indices;
}

function dayLabel(dateKey: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${dateKey}T00:00:00Z`));
}

function XLabels({ series, locale }: { series: readonly SalesPoint[]; locale: Locale }) {
  return (
    <div
      aria-hidden="true"
      className="mt-1 flex justify-between text-xs text-muted-foreground"
    >
      {labelIndices(series.length).map((index) => (
        <span key={series[index].dateKey}>
          {dayLabel(series[index].dateKey, locale)}
        </span>
      ))}
    </div>
  );
}

/** Vendas ao longo do tempo — linha + área com pontos (dias ≤ 31). */
export function SalesChart({
  series,
  locale,
  currency,
}: {
  series: readonly SalesPoint[];
  locale: Locale;
  currency: string;
}) {
  const max = niceMax(Math.max(...series.map((point) => point.sales), 0));
  const count = series.length;
  const plotW = W - PAD_X * 2;
  const plotH = H - PAD_Y * 2;
  const xAt = (index: number) =>
    PAD_X + (count === 1 ? plotW / 2 : (index * plotW) / (count - 1));
  const yAt = (value: number) => PAD_Y + plotH - (value / max) * plotH;

  const points = series.map(
    (point, index) => `${xAt(index).toFixed(1)},${yAt(point.sales).toFixed(1)}`,
  );
  const linePath = points.length > 1 ? `M ${points.join(" L ")}` : "";
  const baseline = (PAD_Y + plotH).toFixed(1);
  const areaPath =
    points.length > 1
      ? `${linePath} L ${xAt(count - 1).toFixed(1)},${baseline} L ${xAt(0).toFixed(1)},${baseline} Z`
      : "";
  const showDots = count <= 31;

  return (
    <div>
      <div className="mb-1 flex justify-end text-xs text-muted-foreground">
        {formatCurrency(max, currency, locale)}
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        aria-hidden="true"
        focusable="false"
      >
        {[0, 0.25, 0.5, 0.75, 1].map((fraction) => (
          <line
            key={fraction}
            x1={PAD_X}
            x2={W - PAD_X}
            y1={yAt(max * fraction)}
            y2={yAt(max * fraction)}
            stroke="var(--border)"
            strokeWidth="1"
          />
        ))}
        {areaPath && (
          <path d={areaPath} fill="var(--primary)" opacity="0.12" />
        )}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}
        {showDots &&
          series.map((point, index) => (
            <circle
              key={point.dateKey}
              cx={xAt(index)}
              cy={yAt(point.sales)}
              r="3.5"
              fill="var(--primary)"
            />
          ))}
      </svg>
      <XLabels series={series} locale={locale} />
    </div>
  );
}

/** Volume de pedidos por dia — barras (mesmo eixo X das vendas). */
export function OrdersChart({
  series,
  locale,
}: {
  series: readonly SalesPoint[];
  locale: Locale;
}) {
  const maxCount = Math.max(...series.map((point) => point.orders), 0);
  // Teto inteiro: barras contam pedidos (rótulo sem "2.5").
  const max = Math.max(1, Math.ceil(niceMax(maxCount)));
  const count = series.length;
  const plotW = W - PAD_X * 2;
  const plotH = H - PAD_Y * 2;
  const step = plotW / count;
  const gap = count > 60 ? 1 : 3;
  const barW = Math.max(1, Math.min(28, step - gap));

  return (
    <div>
      <div className="mb-1 flex justify-end text-xs text-muted-foreground">
        {formatNumber(max, locale)}
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        aria-hidden="true"
        focusable="false"
      >
        {[0, 0.25, 0.5, 0.75, 1].map((fraction) => (
          <line
            key={fraction}
            x1={PAD_X}
            x2={W - PAD_X}
            y1={PAD_Y + plotH * (1 - fraction)}
            y2={PAD_Y + plotH * (1 - fraction)}
            stroke="var(--border)"
            strokeWidth="1"
          />
        ))}
        {series.map((point, index) => {
          const height = (point.orders / max) * plotH;
          if (height <= 0) return null;
          return (
            <rect
              key={point.dateKey}
              x={PAD_X + index * step + (step - barW) / 2}
              y={PAD_Y + plotH - height}
              width={barW}
              height={height}
              rx="2"
              fill="var(--primary)"
              opacity="0.85"
            />
          );
        })}
      </svg>
      <XLabels series={series} locale={locale} />
    </div>
  );
}
