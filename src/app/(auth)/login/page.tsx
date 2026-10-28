import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import { getLocale } from "@/lib/i18n/locale";

export const metadata: Metadata = {
  title: "Sign in",
};

/** Lê o cookie de idioma e de sessão — rota dinâmica por natureza. */
export const instant = false;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const locale = await getLocale();
  const { next } = await searchParams;

  return <LoginForm locale={locale} next={next} />;
}
