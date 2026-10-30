/**
 * Domínio de APARÊNCIA da vitrine — puro, sem servidor nem cliente.
 *
 * A aparência vive nas colunas da própria tabela `stores` (nenhuma tabela
 * extra): template, cores, layout de produto, proporção de imagem e estilos
 * de botão/card. Estes limites são DELIBERADOS — customização controlada,
 * nunca um construtor de páginas.
 *
 * O mesmo módulo alimenta:
 *  • a action que grava (stores/actions.ts);
 *  • o formulário do painel (components/appearance/appearance-form.tsx);
 *  • o tema da vitrine pública (lib/storefront/theme.ts).
 */

export const STORE_TEMPLATES = [
  "minimal",
  "market",
  "fashion",
  "restaurant",
] as const;
export type StoreTemplate = (typeof STORE_TEMPLATES)[number];

export const PRODUCT_LAYOUTS = ["grid", "list"] as const;
export type ProductLayout = (typeof PRODUCT_LAYOUTS)[number];

export const IMAGE_RATIOS = ["square", "portrait", "landscape"] as const;
export type ImageRatio = (typeof IMAGE_RATIOS)[number];

export const BUTTON_STYLES = ["rounded", "soft", "compact"] as const;
export type ButtonStyle = (typeof BUTTON_STYLES)[number];

export const CARD_STYLES = ["subtle", "rounded", "minimal"] as const;
export type CardStyle = (typeof CARD_STYLES)[number];

/** Campos de aparência persistidos em `stores`. */
export type AppearanceValues = {
  template: StoreTemplate;
  primary_color: string | null;
  button_color: string | null;
  accent_color: string | null;
  background_color: string | null;
  product_layout: ProductLayout;
  image_ratio: ImageRatio;
  button_style: ButtonStyle;
  card_style: CardStyle;
};

/** Padrão da vitrine quando o lojista nunca tocou na aparência. */
export const DEFAULT_APPEARANCE: AppearanceValues = {
  template: "minimal",
  primary_color: null,
  button_color: null,
  accent_color: null,
  background_color: null,
  product_layout: "grid",
  image_ratio: "square",
  button_style: "rounded",
  card_style: "subtle",
};

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

export function isValidHexColor(value: string): boolean {
  return HEX_COLOR_PATTERN.test(value);
}

/** Valida um valor contra uma lista de opções fechadas. */
export function isOneOf<T extends string>(
  value: unknown,
  options: readonly T[],
): value is T {
  return typeof value === "string" && (options as readonly string[]).includes(value);
}

/**
 * Coerce os valores vindos do banco (texto) para o domínio tipado.
 * Qualquer valor fora das listas cai no default — a vitrine nunca quebra
 * por causa de uma coluna inesperada.
 */
export function normalizeAppearance(input: {
  template?: string | null;
  primary_color?: string | null;
  button_color?: string | null;
  accent_color?: string | null;
  background_color?: string | null;
  product_layout?: string | null;
  image_ratio?: string | null;
  button_style?: string | null;
  card_style?: string | null;
}): AppearanceValues {
  const color = (value: string | null | undefined): string | null =>
    value && isValidHexColor(value) ? value.toLowerCase() : null;

  return {
    template: isOneOf(input.template, STORE_TEMPLATES)
      ? input.template
      : DEFAULT_APPEARANCE.template,
    primary_color: color(input.primary_color),
    button_color: color(input.button_color),
    accent_color: color(input.accent_color),
    background_color: color(input.background_color),
    product_layout: isOneOf(input.product_layout, PRODUCT_LAYOUTS)
      ? input.product_layout
      : DEFAULT_APPEARANCE.product_layout,
    image_ratio: isOneOf(input.image_ratio, IMAGE_RATIOS)
      ? input.image_ratio
      : DEFAULT_APPEARANCE.image_ratio,
    button_style: isOneOf(input.button_style, BUTTON_STYLES)
      ? input.button_style
      : DEFAULT_APPEARANCE.button_style,
    card_style: isOneOf(input.card_style, CARD_STYLES)
      ? input.card_style
      : DEFAULT_APPEARANCE.card_style,
  };
}
