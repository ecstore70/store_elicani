/**
 * Opções de produto — estrutura GENÉRICA para escolhas configuráveis
 * (tamanho, extras, remoções…), pronta para quando o esquema/modelo de
 * dados ganhar suporte a opções.
 *
 * A vitrine já renderiza (`ProductOptionSelector`), soma o preço ao carrinho
 * (`SelectedOption.priceDelta`) e inclui as escolhas na mensagem do
 * WhatsApp — mas um produto SEM opções nunca mostra secção vazia.
 *
 * Puro: sem servidor, nem cliente, nem toques na base de dados.
 */

export type ProductOptionChoice = {
  id: string;
  label: string;
  /** Acréscimo/desconto ao preço base (0 = sem diferença de preço). */
  priceDelta: number;
};

export type ProductOptionGroup = {
  id: string;
  label: string;
  /** `single` = rádio (ex.: tamanho); `multi` = caixas (ex.: extras). */
  type: "single" | "multi";
  required: boolean;
  choices: ProductOptionChoice[];
};

/** Escolha FEITA pelo cliente — viaja no item do carrinho. */
export type SelectedOption = {
  groupLabel: string;
  choiceLabel: string;
  priceDelta: number;
};

/** Assinatura de identidade do item: produto + opções escolhidas. */
export function optionsSignature(options: readonly SelectedOption[]): string {
  if (options.length === 0) return "";
  return options
    .map((option) => `${option.groupLabel}:${option.choiceLabel}`)
    .sort()
    .join("|");
}

/** Preço extra somado pelas opções escolhidas. */
export function selectedOptionsPrice(
  options: readonly SelectedOption[],
): number {
  return options.reduce((total, option) => total + option.priceDelta, 0);
}

/**
 * Valida escolhas obrigatórias — `null` quando tudo está preenchido,
 * ou o rótulo do primeiro grupo obrigatório ainda por escolher.
 */
export function firstUnselectedRequired(
  groups: readonly ProductOptionGroup[],
  selected: Record<string, string[]>,
): string | null {
  for (const group of groups) {
    if (!group.required) continue;
    const picked = selected[group.id] ?? [];
    if (picked.length === 0) return group.label;
  }
  return null;
}

/** Desconto percentual arredondado (0 quando não há promoção). */
export function discountPercent(
  price: number,
  promoPrice: number | null,
): number {
  if (promoPrice === null || promoPrice >= price || price <= 0) return 0;
  return Math.round((1 - promoPrice / price) * 100);
}
