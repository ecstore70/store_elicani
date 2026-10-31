"use server";

import { cookies } from "next/headers";
import { isSupportedLocale, LOCALE_COOKIE } from "./config.ts";

/**
 * Persiste a escolha de idioma da UI no cookie `elicani_locale`.
 *
 * É a ÚNICA fonte de persistência de idioma — a mesma para visitante,
 * autenticado, painel e vitrine (sem sistemas duplicados). O cookie é
 * lido por `getLocale()` no servidor; não é preciso revalidar rotas
 * porque todas as rotas que consomem idioma são dinâmicas.
 *
 * A validação acontece aqui (nunca confiar no cliente): valores fora
 * dos 9 idiomas suportados são ignorados.
 */
export async function setLocale(locale: string): Promise<void> {
  if (!isSupportedLocale(locale)) return;

  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 ano — a escolha persiste entre sessões
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  });
}
