/**
 * Configuração de idiomas do Elicani.
 *
 * Regras da Fase 1:
 *  • idioma, moeda e país são INDEPENDENTES (país=MZ + idioma=en + moeda=USD é válido);
 *  • códigos seguem BCP 47 ("pt-BR", "zh-Hans");
 *  • idioma padrão da aplicação: "en".
 *
 * Este módulo é puro (sem Next/React) e pode ser usado no cliente e no servidor.
 */

export const DEFAULT_LOCALE = "en";

/** Idiomas de UI suportados inicialmente. */
export const SUPPORTED_LOCALES = [
  "en",
  "pt-BR",
  "pt-PT",
  "es",
  "fr",
  "de",
  "ar",
  "zh-Hans",
  "ja",
] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

/** Cookie usado para persistir a escolha de idioma (futuro seletor de UI). */
export const LOCALE_COOKIE = "elicani_locale";

/**
 * Nome de cada idioma na própria língua — é assim que um idioma se
 * apresenta num seletor (padrão de produto internacional).
 */
export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  "pt-BR": "Português (Brasil)",
  "pt-PT": "Português (Portugal)",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  ar: "العربية",
  "zh-Hans": "简体中文",
  ja: "日本語",
};

export function isSupportedLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" &&
    (SUPPORTED_LOCALES as readonly string[]).includes(value)
  );
}

/**
 * Normaliza um valor vindo de cookie/query/coluna para um Locale suportado.
 * Aceita variações de caixa ("PT-pt" → "pt-PT"). Caia no padrão se desconhecido.
 */
export function normalizeLocale(
  value: string | null | undefined,
  fallback: Locale = DEFAULT_LOCALE,
): Locale {
  if (!value) return fallback;

  const needle = value.trim().toLowerCase();
  const match = SUPPORTED_LOCALES.find(
    (locale) => locale.toLowerCase() === needle,
  );

  return match ?? fallback;
}

/**
 * Direção de escrita — preparado para árabe (RTL) sem redesenhar o layout.
 */
export function getLocaleDirection(
  locale: Locale,
): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}
