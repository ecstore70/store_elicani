/**
 * Moedas (ISO 4217) e formatação de valores.
 *
 * A moeda é INDEPENDENTE do país e do idioma: um lojista de Moçambique pode
 * vender em USD, e a mesma tela formata qualquer moeda suportada mudando
 * apenas o parâmetro — a lógica da aplicação não muda.
 *
 * Formatação delegada ao Intl.NumberFormat (nada de símbolos hardcoded).
 */
import { DEFAULT_LOCALE } from "./i18n/config.ts";

export const DEFAULT_CURRENCY = "USD";

export type CurrencyInfo = {
  code: string;
  label: string;
};

/** Moedas suportadas inicialmente. */
export const SUPPORTED_CURRENCIES: readonly CurrencyInfo[] = [
  { code: "USD", label: "US Dollar" },
  { code: "EUR", label: "Euro" },
  { code: "GBP", label: "Pound Sterling" },
  { code: "CAD", label: "Canadian Dollar" },
  { code: "AUD", label: "Australian Dollar" },
  { code: "BRL", label: "Brazilian Real" },
  { code: "MZN", label: "Mozambican Metical" },
  { code: "ZAR", label: "South African Rand" },
  { code: "AOA", label: "Angolan Kwanza" },
  { code: "NGN", label: "Nigerian Naira" },
  { code: "KES", label: "Kenyan Shilling" },
  { code: "GHS", label: "Ghanaian Cedi" },
  { code: "INR", label: "Indian Rupee" },
  { code: "CNY", label: "Chinese Yuan" },
  { code: "JPY", label: "Japanese Yen" },
];

export function isSupportedCurrency(code: string): boolean {
  return SUPPORTED_CURRENCIES.some((currency) => currency.code === code);
}

export function getCurrencyInfo(code: string): CurrencyInfo | null {
  return SUPPORTED_CURRENCIES.find((currency) => currency.code === code) ?? null;
}

/** Nome da moeda no idioma informado (fallback: rótulo em inglês). */
export function getCurrencyLabel(code: string, locale: string = DEFAULT_LOCALE): string {
  const info = getCurrencyInfo(code);
  if (!info) return code;

  try {
    return new Intl.DisplayNames([locale], { type: "currency" }).of(code) ?? info.label;
  } catch {
    return info.label;
  }
}

/**
 * Formata um valor monetário em qualquer moeda suportada.
 *
 *   formatCurrency(1234.56, "USD", "en")  →  "$1,234.56"
 *   formatCurrency(1234.56, "USD", "pt-BR") →  "US$ 1.234,56"
 *   formatCurrency(1234.56, "MZN", "en")  →  "MT1,234.56"
 */
export function formatCurrency(
  amount: number,
  currency: string,
  locale: string = DEFAULT_LOCALE,
): string {
  if (!isSupportedCurrency(currency)) {
    return `${currency} ${amount.toFixed(2)}`;
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      currencyDisplay: "symbol",
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

/** Número formatado conforme o idioma (usado nos cartões de resumo). */
export function formatNumber(value: number, locale: string = DEFAULT_LOCALE): string {
  try {
    return new Intl.NumberFormat(locale).format(value);
  } catch {
    return String(value);
  }
}
