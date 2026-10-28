/**
 * Tradução de strings.
 *
 * Arquitetura: catálogo em inglês ("en") é a base; outros idiomas entram
 * como `Partial<Messages>` e apenas SOBREPOEM as chaves traduzidas — as
 * ausentes caem automaticamente no inglês. Isso permite adicionar idiomas
 * sem tocar em nenhum componente.
 */
import {
  DEFAULT_LOCALE,
  normalizeLocale,
  type Locale,
} from "./config.ts";
import { en, type MessageKey, type Messages } from "./messages/en.ts";

type PartialMessages = Partial<Messages>;

/** Catálogos registrados. Adicione aqui novos idiomas quando traduzidos. */
const catalogs: Partial<Record<Locale, PartialMessages>> = {
  en,
  // Ex.: "pt-BR": ptBR,
};

export function getMessages(locale: Locale): Messages {
  const catalog = catalogs[locale] ?? {};
  return { ...en, ...catalog };
}

export type Translator = (
  key: MessageKey,
  params?: Record<string, string | number>,
) => string;

function interpolate(text: string, params?: Record<string, string | number>): string {
  if (!params) return text;

  let result = text;
  for (const [name, value] of Object.entries(params)) {
    result = result.replaceAll(`{${name}}`, String(value));
  }
  return result;
}

/** Cria um tradutor para um idioma. Idiomas não registrados caem no padrão. */
export function createTranslator(locale: Locale = DEFAULT_LOCALE): Translator {
  const messages = getMessages(normalizeLocale(locale));

  return (key, params) => interpolate(messages[key] ?? en[key], params);
}
