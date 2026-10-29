import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { getLocale } from "@/lib/i18n/locale";

export const metadata: Metadata = {
  title: "Reset password",
};

/** Lê o cookie de idioma — rota dinâmica por natureza. */
export const instant = false;

export default async function ForgotPasswordPage() {
  const locale = await getLocale();

  return <ForgotPasswordForm locale={locale} />;
}
