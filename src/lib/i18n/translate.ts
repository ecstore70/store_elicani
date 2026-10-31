/**
 * Tradução de strings.
 *
 * Arquitetura: catálogo em inglês ("en") é a base; os demais idiomas
 * entram como `Partial<Messages>` e apenas SOBREPOEM as chaves traduzidas —
 * as ausentes caem automaticamente no inglês. Isso permite adicionar idiomas
 * sem tocar em nenhum componente.
 *
 * Os 9 idiomas suportados estão registrados; nesta fase todos os catálogos
 * estão completos (o teste `i18n.test.ts` garante a cobertura das chaves).
 */
import {
  DEFAULT_LOCALE,
  normalizeLocale,
  type Locale,
} from "./config.ts";
import { en, type MessageKey, type Messages } from "./messages/en.ts";
import { ptBR } from "./messages/pt-BR.ts";
import { ptPT } from "./messages/pt-PT.ts";
import { es } from "./messages/es.ts";
import { fr } from "./messages/fr.ts";
import { de } from "./messages/de.ts";
import { ar } from "./messages/ar.ts";
import { zhHans } from "./messages/zh-Hans.ts";
import { ja } from "./messages/ja.ts";

type PartialMessages = Partial<Messages>;

/** Catálogos registrados — os 9 idiomas suportados da Fase 1. */
const catalogs: Partial<Record<Locale, PartialMessages>> = {
  en,
  "pt-BR": ptBR,
  "pt-PT": ptPT,
  es,
  fr,
  de,
  ar,
  "zh-Hans": zhHans,
  ja,
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
