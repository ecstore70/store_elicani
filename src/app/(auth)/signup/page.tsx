import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/signup-form";
import { getLocale } from "@/lib/i18n/locale";

export const metadata: Metadata = {
  title: "Create account",
};

/** Lê o cookie de idioma — rota dinâmica por natureza. */
export const instant = false;

export default async function SignupPage() {
  const locale = await getLocale();

  return <SignupForm locale={locale} />;
}
