import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import { getLocale } from "@/lib/i18n/locale";
import { createTranslator } from "@/lib/i18n/translate";

export const metadata: Metadata = {
  title: "Sign in",
};

/** Lê o cookie de idioma e de sessão — rota dinâmica por natureza. */
export const instant = false;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; reset?: string }>;
}) {
  const locale = await getLocale();
  const { next, error, reset } = await searchParams;

  // Erro vindo do callback OAuth (/auth/callback) — mensagem genérica.
  const initialError =
    error === "oauth" ? createTranslator(locale)("auth.error.oauth") : null;

  return (
    <LoginForm
      locale={locale}
      next={next}
      initialError={initialError}
      resetDone={reset === "1"}
    />
  );
}
