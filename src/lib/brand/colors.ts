/**
 * Paleta oficial da marca Elicani (da arte de referência).
 *
 * Fonte única de verdade para as cores da marca no código. Mantida em
 * sincronia com os tokens CSS (`--brand-*` em globals.css) e com os assets
 * exportados (`node scripts/generate-brand.mjs`). Não espalhar cores duras
 * pelas componentes — importar daqui ou usar os utilitários `brand-*`.
 */
export const BRAND = {
  /** Azul principal — símbolo, acentos, links. */
  primary: "#2563eb",
  /** Escuro — wordmark sobre fundos claros, texto de marca. */
  dark: "#0f172a",
  /** Cinza — texto muted, marca subtil. */
  muted: "#94a3b8",
  /** Fundo — superfície clara da plataforma. */
  background: "#f8fafc",
  /** Branco — wordmark sobre fundos escuros. */
  white: "#ffffff",
} as const;
