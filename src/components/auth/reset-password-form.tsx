"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { PasswordField } from "@/components/auth/password-field";
import { FormAlert } from "@/components/shared/form-alert";
import { Button } from "@/components/ui/button";
import { resetPasswordAction } from "@/lib/auth/actions";
import { INITIAL_AUTH_STATE } from "@/lib/auth/types";
import { type Locale } from "@/lib/i18n/config";
import { createTranslator } from "@/lib/i18n/translate";

/**
 * Formulário de nova senha. O `?code=` do link de recuperação viaja como
 * campo oculto e é trocado por sessão dentro da server action — o link
 * só é válido para esta finalização de redefinição.
 *
 * Em caso de link expirado/inválido (troca falhou na action), o alerta
 * explica o problema e o link abaixo leva a um novo pedido de recuperação.
 */
export function ResetPasswordForm({ locale, code }: { locale: Locale; code?: string }) {
  const t = createTranslator(locale);
  const [state, formAction, pending] = useActionState(
    resetPasswordAction,
    INITIAL_AUTH_STATE,
  );

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-xl font-semibold tracking-tight">
          {t("auth.reset.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("auth.reset.subtitle")}
        </p>
      </div>

      <form action={formAction} className="space-y-4" noValidate>
        {code ? <input type="hidden" name="code" value={code} /> : null}

        {state.error && <FormAlert tone="error">{state.error}</FormAlert>}

        <PasswordField
          label={t("auth.reset.newPassword")}
          name="password"
          autoComplete="new-password"
          showLabel={t("auth.showPassword")}
          hideLabel={t("auth.hidePassword")}
          hint={t("auth.passwordHint")}
          minLength={8}
          required
        />

        <PasswordField
          label={t("auth.reset.confirmPassword")}
          name="confirm"
          autoComplete="new-password"
          showLabel={t("auth.showPassword")}
          hideLabel={t("auth.hidePassword")}
          required
        />

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending && (
            <Loader2 aria-hidden="true" data-icon="inline-start" className="animate-spin" />
          )}
          {t("auth.reset.submit")}
        </Button>
      </form>

      <p className="text-sm text-muted-foreground">
        <Link
          href="/forgot-password"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          {t("auth.forgot.submit")}
        </Link>
        {" · "}
        <Link
          href="/login"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          {t("auth.forgot.backToLogin")}
        </Link>
      </p>
    </div>
  );
}
