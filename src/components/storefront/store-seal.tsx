import {
  BOTTOM_ARC_PATH,
  ROSETTE_PATH,
  RING_TEXT,
  TOP_ARC_PATH,
  layoutSeal,
  sealArcId,
} from "@/lib/storefront/seal-layout";

/**
 * Selo de capacidade — gráfico vetorial puro (nunca emoji, nunca ícone
 * de biblioteca, nunca imagem externa): roseta + anéis + tipografia
 * circular da marca + mensagem central resolvida por `layoutSeal`.
 *
 * Cores inteiramente temáticas (`--sf-primary` / `--sf-fg`): o selo
 * herda a aparência do comerciante sem nenhuma cor fixa. Informativo,
 * portanto NÃO clicável; o texto significativo é exposto via
 * `role="img"` + `aria-label` (o SVG inteiro é ignorado pelo leitor de
 * tela quando rotulado, evitando leitura duplicada).
 */
export function StoreSeal({
  text,
  className,
}: {
  /** Mensagem exibida (ex.: "Pedidos via WhatsApp"). */
  text: string;
  className?: string;
}) {
  const { lines, fs, baselines, dotsY } = layoutSeal(text);
  const arcId = sealArcId(text);
  // Tracking 0.06em em latinos; árabe é script ligado — espaçar quebra
  // a ligação das letras, então vai sem tracking.
  const tracking = /[\u0600-\u06ff]/.test(lines.join("")) ? undefined : "0.06em";

  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-label={text}
      className={className}
      focusable="false"
    >
      {/* borda em roseta + anéis concêntricos */}
      <path
        d={ROSETTE_PATH}
        fill="none"
        stroke="var(--sf-primary)"
        strokeWidth={1.2}
        strokeOpacity={0.9}
        strokeLinejoin="round"
      />
      <circle
        cx="50"
        cy="50"
        r="41"
        fill="none"
        stroke="var(--sf-primary)"
        strokeWidth={1.5}
      />
      <circle
        cx="50"
        cy="50"
        r="34.8"
        fill="none"
        stroke="var(--sf-primary)"
        strokeWidth={0.7}
        strokeOpacity={0.55}
      />

      {/* disco central: tinta fraca do tema, dá profundidade sem gradiente */}
      <circle cx="50" cy="50" r="33.2" fill="var(--sf-primary)" fillOpacity={0.06} />

      {/* tipografia circular da marca (arcos ocultos em defs) */}
      <defs>
        <path id={`${arcId}-t`} d={TOP_ARC_PATH} />
        <path id={`${arcId}-b`} d={BOTTOM_ARC_PATH} />
      </defs>
      <text
        fontSize={5.2}
        fontWeight={600}
        letterSpacing="0.08em"
        textAnchor="middle"
        fill="var(--sf-primary)"
        fillOpacity={0.85}
        style={{ direction: "ltr" }}
      >
        <textPath href={`#${arcId}-t`} startOffset="50%">
          {RING_TEXT}
        </textPath>
      </text>
      <text
        fontSize={5.2}
        fontWeight={600}
        letterSpacing="0.08em"
        textAnchor="middle"
        fill="var(--sf-primary)"
        fillOpacity={0.85}
        style={{ direction: "ltr" }}
      >
        <textPath href={`#${arcId}-b`} startOffset="50%">
          {RING_TEXT}
        </textPath>
      </text>

      {/* mensagem central — linhas maiúsculas centradas */}
      {lines.map((line, index) => (
        <text
          key={`${line}-${index}`}
          x="50"
          y={baselines[index]}
          textAnchor="middle"
          fontSize={fs}
          fontWeight={700}
          letterSpacing={tracking}
          fill="var(--sf-fg)"
        >
          {line}
        </text>
      ))}

      {/* pontinhos decorativos sob a mensagem */}
      <g fill="var(--sf-primary)">
        <circle cx="44.8" cy={dotsY} r="1.1" />
        <circle cx="50" cy={dotsY} r="1.1" />
        <circle cx="55.2" cy={dotsY} r="1.1" />
      </g>
    </svg>
  );
}
