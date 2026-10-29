"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { FormAlert } from "@/components/shared/form-alert";
import { TextField } from "@/components/store/fields";
import { Button } from "@/components/ui/button";
import { forgotPasswordAction } from "@/lib/auth/actions";
import { INITIAL_AUTH_STATE } from "@/lib/auth/types";
import { type Locale } from "@/lib/i18n/config";
import { createTranslator } from "@/lib/i18n/translate";

export function ForgotPasswordForm({ locale }: { locale: Locale }) {
  const t = createTranslator(locale);
  const [state, formAction, pending] = useActionState(
    forgotPasswordAction,
    INITIAL_AUTH_STATE,
  );

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-xl font-semibold tracking-tight">
          {t("auth.forgot.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("auth.forgot.subtitle")}
        </p>
      </div>

      <form action={formAction} className="space-y-4" noValidate>
        {state.error && <FormAlert tone="error">{state.error}</FormAlert>}
        {state.notice && <FormAlert tone="success">{state.notice}</FormAlert>}

        <TextField
          label={t("auth.email")}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder={t("auth.emailPlaceholder")}
          required
        />

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending && (
            <Loader2 aria-hidden="true" data-icon="inline-start" className="animate-spin" />
          )}
          {t("auth.forgot.submit")}
        </Button>
      </form>

      <p className="text-sm text-muted-foreground">
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
