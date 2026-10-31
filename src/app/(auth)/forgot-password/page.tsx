import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { getLocale } from "@/lib/i18n/locale";
import { createTranslator } from "@/lib/i18n/translate";

export async function generateMetadata(): Promise<Metadata> {
  const t = createTranslator(await getLocale());
  return { title: t("auth.forgot.title") };
}

/** Lê o cookie de idioma — rota dinâmica por natureza. */
export const instant = false;

export default async function ForgotPasswordPage() {
  const locale = await getLocale();

  return <ForgotPasswordForm locale={locale} />;
}
