import "server-only";

import { cookies } from "next/headers";
import { LOCALE_COOKIE, normalizeLocale, type Locale } from "./config.ts";
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
