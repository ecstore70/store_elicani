import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/brand/colors";
import {
  LOGO_VIEWBOX,
  MARK_PATHS,
  MARK_VIEWBOX,
  WORDMARK_BODY,
  WORDMARK_DOTS,
  WORDMARK_STROKE,
} from "@/lib/brand/logo-paths";

/**
 * Marca oficial do Elicani: símbolo do carrinho-"e" + wordmark "Elicani".
 *
 * Geometria gerada por `scripts/generate-brand.mjs` (traçado da arte de
 * referência + wordmark Poppins Black em outline). Sem texto HTML a fingir
 * de logo — o wordmark é vetor real, independente de idioma.
 *
 * Variantes:
 *  - `color`  (default): fundos claros — wordmark navy, acentos azuis.
 *  - `dark`:             fundos escuros — wordmark branco, acentos azuis.
 *  - `mono`:             monocromático via `currentColor` (cor do contexto).
 *
 * `markOnly` renderiza apenas o símbolo (cabeçalhos compactos, favicon base).
 */
export type LogoVariant = "color" | "dark" | "mono";

export function Logo({
  variant = "color",
  markOnly = false,
  className,
}: {
  variant?: LogoVariant;
  markOnly?: boolean;
  className?: string;
}) {
  const markFill = variant === "mono" ? "currentColor" : BRAND.primary;
  const wordFill =
    variant === "mono"
      ? "currentColor"
      : variant === "dark"
        ? BRAND.white
        : BRAND.dark;
  const dotFill = variant === "mono" ? "currentColor" : BRAND.primary;

  if (markOnly) {
    return (
      <svg
        viewBox={MARK_VIEWBOX}
        role="img"
        aria-label="Elicani"
        className={cn("h-6 w-auto shrink-0", className)}
      >
        {MARK_PATHS.map((d, i) => (
          <path key={i} d={d} fill={markFill} />
        ))}
      </svg>
    );
  }

  return (
    <svg
      viewBox={LOGO_VIEWBOX}
      role="img"
      aria-label="Elicani"
      className={cn("h-7 w-auto shrink-0", className)}
    >
      {MARK_PATHS.map((d, i) => (
        <path key={`m${i}`} d={d} fill={markFill} />
      ))}
      <path
        d={WORDMARK_BODY}
        fill={wordFill}
        stroke={wordFill}
        strokeWidth={WORDMARK_STROKE}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {WORDMARK_DOTS.map((d, i) => (
        <path
          key={`d${i}`}
          d={d}
          fill={dotFill}
          stroke={dotFill}
          strokeWidth={WORDMARK_STROKE}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}
