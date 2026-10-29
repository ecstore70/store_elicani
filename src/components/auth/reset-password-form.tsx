"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { FormAlert } from "@/components/shared/form-alert";
import { TextField } from "@/components/store/fields";
import { Button } from "@/components/ui/button";
import { resetPasswordAction } from "@/lib/auth/actions";
import { INITIAL_AUTH_STATE } from "@/lib/auth/types";
import { type Locale } from "@/lib/i18n/config";
import { createTranslator } from "@/lib/i18n/translate";

/**
 * Formulário de nova senha. O `?code=` do link de recuperação viaja como
 * campo oculto e é trocado por sessão dentro da server action — o link
 * só é válido para esta finalização de redefinição.
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

        <TextField
          label={t("auth.reset.newPassword")}
          name="password"
          type="password"
          autoComplete="new-password"
          hint={t("auth.passwordHint")}
          required
        />

        <TextField
          label={t("auth.reset.confirmPassword")}
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
        />

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending && (
            <Loader2 aria-hidden="true" data-icon="inline-start" className="animate-spin" />
          )}
          {t("auth.reset.submit")}
        </Button>
      </form>
    </div>
  );
}
