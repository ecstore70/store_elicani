import "server-only";

import { cookies } from "next/headers";
import { LOCALE_COOKIE, isSupportedLocale, normalizeLocale, type Locale } from "./config.ts";
import { createTranslator, type Translator } from "./translate.ts";

/**
 * Idioma da UI: lê o cookie `elicani_locale` e cai no padrão ("en").
 *
 * A Fase 1 não expõe seletor de idioma — mas o canal já existe, então
 * adicionar o seletor depois não exige refatorar componentes.
 */
export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  return normalizeLocale(cookieStore.get(LOCALE_COOKIE)?.value);
}

/** Tradutor pronto para uso em Server Components e Server Actions. */
export async function getTranslator(): Promise<Translator> {
  return createTranslator(await getLocale());
}

/**
 * Escolha EXPLÍCITA do visitante, ou `null` se nunca escolheu.
 *
 * Distinguir "não escolheu" de "escolheu o padrão" permite à vitrine
 * pública respeitar a preferência do visitante quando existe e cair no
 * idioma configurado pela loja quando não existe — sem sistemas duplos.
 */
export async function getLocaleChoice(): Promise<Locale | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(LOCALE_COOKIE)?.value;
  return isSupportedLocale(raw) ? raw : null;
}
