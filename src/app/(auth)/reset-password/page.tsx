import type { Metadata } from "next";
import Link from "next/link";
import { FormAlert } from "@/components/shared/form-alert";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { getLocale } from "@/lib/i18n/locale";
import { createTranslator } from "@/lib/i18n/translate";

export async function generateMetadata(): Promise<Metadata> {
  const t = createTranslator(await getLocale());
  return { title: t("auth.reset.title") };
}

/** Lê o cookie de idioma — rota dinâmica por natureza. */
export const instant = false;

/**
 * Destino do link de recuperação de senha (`redirectTo` em
 * `resetPasswordForEmail` → `${NEXT_PUBLIC_SITE_URL}/reset-password`).
 *
 * O link do Supabase chega como `?code=` (PKCE); o código é trocado por
 * sessão dentro da server action do formulário. `error`/`error_description`
 * aparecem quando o link expirou ou já foi usado — aí só pedir outro.
 */
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; error?: string; error_description?: string }>;
}) {
  const locale = await getLocale();
  const { code, error, error_description } = await searchParams;

  if (error || error_description) {
    const t = createTranslator(locale);
    return (
      <div className="space-y-6">
        <div className="space-y-1.5">
          <h1 className="text-xl font-semibold tracking-tight">
            {t("auth.reset.title")}
          </h1>
        </div>
        <FormAlert tone="error">{t("auth.reset.invalidLink")}</FormAlert>
        <p className="text-sm text-muted-foreground">
          <Link
            href="/forgot-password"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            {t("auth.forgot.submit")}
          </Link>
        </p>
      </div>
    );
  }

  return <ResetPasswordForm locale={locale} code={code} />;
}
