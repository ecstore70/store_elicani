import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/signup-form";
import { getLocale } from "@/lib/i18n/locale";
import { createTranslator } from "@/lib/i18n/translate";

export async function generateMetadata(): Promise<Metadata> {
  const t = createTranslator(await getLocale());
  return { title: t("auth.createAccount") };
}

/** Lê o cookie de idioma — rota dinâmica por natureza. */
export const instant = false;

export default async function SignupPage() {
  const locale = await getLocale();

  return <SignupForm locale={locale} />;
}
