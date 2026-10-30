import type { AppearanceValues, StoreTemplate } from "@/lib/stores/appearance";

/**
 * Tema da vitrine — PURO, sem servidor nem cliente.
 *
 * Converte a aparência escolhida pelo comerciante em variáveis CSS +
 * classes estáticas. Toda a customização passa por aqui: a vitrine e o
 * preview do painel usam EXATAMENTE o mesmo resolvedor, então o que o
 * comerciante vê no preview é o que o cliente vê na loja.
 *
 * Acessibilidade: o texto principal usa `--sf-fg` derivado por LUMINÂNCIA
 * do fundo escolhido — um fundo escuro nunca recebe texto escuro.
 */

export type StorefrontTheme = {
  /** Variáveis CSS aplicadas no raiz da vitrine. */
  cssVars: Record<string, string>;
  template: StoreTemplate;
};

// ── cor utilitária ────────────────────────────────────────────────────────
function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ];
}

/** Luminância relativa simplificada (WCAG-ish). */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Cor de texto legível sobre uma cor de fundo. */
export function readableColorOn(background: string): string {
  return relativeLuminance(background) > 0.45 ? "#0f172a" : "#f8fafc";
}

// ── defaults por template ─────────────────────────────────────────────────
type TemplateDefaults = {
  primary: string;
  background: string;
  /** Espaçamento entre cards (densidade). */
  gap: string;
  /** Espaçamento entre secções. */
  sectionGap: string;
  /** Largura máxima do conteúdo. */
  container: string;
};

const TEMPLATE_DEFAULTS: Record<StoreTemplate, TemplateDefaults> = {
  minimal: {
    primary: "#0f172a",
    background: "#ffffff",
    gap: "1.25rem",
    sectionGap: "3.5rem",
    container: "68rem",
  },
  market: {
    primary: "#2563eb",
    background: "#f8fafc",
    gap: "0.75rem",
    sectionGap: "2rem",
    container: "80rem",
  },
  fashion: {
    primary: "#0f172a",
    background: "#ffffff",
    gap: "1.5rem",
    sectionGap: "4rem",
    container: "72rem",
  },
  restaurant: {
    primary: "#b45309",
    background: "#fffbeb",
    gap: "0.625rem",
    sectionGap: "2rem",
    container: "56rem",
  },
};

// ── estilos controlados ───────────────────────────────────────────────────
const CARD_RADIUS: Record<string, string> = {
  subtle: "0.625rem",
  rounded: "1.25rem",
  minimal: "0.25rem",
};

const BUTTON_RADIUS: Record<string, string> = {
  rounded: "0.625rem",
  soft: "1.25rem",
  compact: "0.375rem",
};

const BUTTON_PADDING: Record<string, { px: string; py: string }> = {
  rounded: { px: "1.125rem", py: "0.625rem" },
  soft: { px: "1.375rem", py: "0.625rem" },
  compact: { px: "0.75rem", py: "0.375rem" },
};

const IMAGE_RATIO: Record<string, string> = {
  square: "1 / 1",
  portrait: "3 / 4",
  landscape: "4 / 3",
};

/**
 * Resolve a aparência em variáveis CSS. Cores inválidas/ausentes caem nos
 * defaults do template — a vitrine nunca quebra por causa de um valor.
 */
export function resolveTheme(appearance: AppearanceValues): StorefrontTheme {
  const defaults = TEMPLATE_DEFAULTS[appearance.template];
  const padding =
    BUTTON_PADDING[appearance.button_style] ?? BUTTON_PADDING.rounded;

  const primary = appearance.primary_color ?? defaults.primary;
  const background = appearance.background_color ?? defaults.background;
  const button = appearance.button_color ?? primary;
  const accent = appearance.accent_color ?? primary;
  const foreground = readableColorOn(background);

  return {
    template: appearance.template,
    cssVars: {
      "--sf-primary": primary,
      "--sf-on-primary": readableColorOn(primary),
      "--sf-button": button,
      "--sf-on-button": readableColorOn(button),
      "--sf-accent": accent,
      "--sf-on-accent": readableColorOn(accent),
      "--sf-bg": background,
      "--sf-fg": foreground,
      "--sf-muted": foreground === "#0f172a" ? "#475569" : "#cbd5e1",
      "--sf-border":
        foreground === "#0f172a" ? "rgba(15, 23, 42, 0.12)" : "rgba(248, 250, 252, 0.16)",
      "--sf-surface":
        foreground === "#0f172a" ? "rgba(15, 23, 42, 0.03)" : "rgba(248, 250, 252, 0.06)",
      "--sf-radius": CARD_RADIUS[appearance.card_style] ?? CARD_RADIUS.subtle,
      "--sf-btn-radius": BUTTON_RADIUS[appearance.button_style] ?? BUTTON_RADIUS.rounded,
      "--sf-btn-px": padding.px,
      "--sf-btn-py": padding.py,
      "--sf-gap": defaults.gap,
      "--sf-section-gap": defaults.sectionGap,
      "--sf-container": defaults.container,
      "--sf-img-ratio": IMAGE_RATIO[appearance.image_ratio] ?? IMAGE_RATIO.square,
    },
  };
}

/**
 * Classes estáticas por template (Tailwind só gera classes escritas por
 * extenso — nada de concatenação dinâmica). A estrutura commerce é comum;
 * só a apresentação muda.
 */
export const TEMPLATE_CLASSES = {
  minimal: {
    heading: "font-semibold tracking-tight",
    price: "font-semibold",
    card: "bg-transparent",
    image: "rounded-[var(--sf-radius)]",
    chip: "rounded-full",
  },
  market: {
    heading: "font-bold",
    price: "font-bold",
    card: "bg-white shadow-sm",
    image: "rounded-[calc(var(--sf-radius)*0.6)]",
    chip: "rounded-lg",
  },
  fashion: {
    heading: "font-medium tracking-[0.2em] uppercase",
    price: "font-medium",
    card: "bg-transparent",
    image: "rounded-none",
    chip: "rounded-full",
  },
  restaurant: {
    heading: "font-semibold",
    price: "font-semibold",
    card: "bg-white",
    image: "rounded-[calc(var(--sf-radius)*0.6)]",
    chip: "rounded-full",
  },
} satisfies Record<StoreTemplate, Record<string, string>>;

/** Classes globais do botão de ação (adicionar ao carrinho). */
export const BUTTON_CLASSES =
  "inline-flex items-center justify-center gap-1.5 rounded-[var(--sf-btn-radius)] bg-[var(--sf-button)] px-[var(--sf-btn-px)] py-[var(--sf-btn-py)] text-sm font-medium text-[var(--sf-on-button)] transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sf-button)] disabled:pointer-events-none disabled:opacity-50";

/** Classes globais do card de produto. */
export const CARD_CLASSES =
  "rounded-[var(--sf-radius)] border border-[var(--sf-border)] bg-[var(--sf-bg)] p-2.5 transition-shadow";
