"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { GoogleIcon } from "@/components/auth/google-icon";
import { PasswordField } from "@/components/auth/password-field";
import { FormAlert } from "@/components/shared/form-alert";
import { TextField } from "@/components/store/fields";
import { Button } from "@/components/ui/button";
import { loginWithGoogleAction, signupAction } from "@/lib/auth/actions";
import { INITIAL_AUTH_STATE } from "@/lib/auth/types";
import { type Locale } from "@/lib/i18n/config";
import { createTranslator } from "@/lib/i18n/translate";

export function SignupForm({ locale }: { locale: Locale }) {
  const t = createTranslator(locale);
  const [state, formAction, pending] = useActionState(
    signupAction,
    INITIAL_AUTH_STATE,
  );
  const [googleState, googleFormAction, googlePending] = useActionState(
    loginWithGoogleAction,
    INITIAL_AUTH_STATE,
  );

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-xl font-semibold tracking-tight">
          {t("auth.signupTitle")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("auth.signupSubtitle")}
        </p>
      </div>

      <div className="space-y-4">
        {state.error && <FormAlert tone="error">{state.error}</FormAlert>}
        {state.notice && <FormAlert tone="success">{state.notice}</FormAlert>}
        {googleState.error && (
          <FormAlert tone="error">{googleState.error}</FormAlert>
        )}

        <form action={formAction} className="space-y-4" noValidate>
          <TextField
            label={t("auth.email")}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder={t("auth.emailPlaceholder")}
            required
          />

          <PasswordField
            label={t("auth.password")}
            name="password"
            autoComplete="new-password"
            showLabel={t("auth.showPassword")}
            hideLabel={t("auth.hidePassword")}
            hint={t("auth.passwordHint")}
            minLength={8}
            required
          />

          {/* Confirmação: validação da aplicação — nunca vai ao Supabase. */}
          <PasswordField
            label={t("auth.confirmPassword")}
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
            {t("auth.createAccount")}
          </Button>
        </form>

        <form action={googleFormAction} className="space-y-3">
          <Button
            type="submit"
            variant="outline"
            size="lg"
            className="w-full"
            disabled={googlePending}
          >
            {googlePending ? (
              <Loader2 aria-hidden="true" data-icon="inline-start" className="animate-spin" />
            ) : (
              <GoogleIcon className="size-4" />
            )}
            {t("auth.google")}
          </Button>
        </form>
      </div>

      <p className="text-sm text-muted-foreground">
        {t("auth.haveAccount")}{" "}
        <Link
          href="/login"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          {t("auth.signIn")}
        </Link>
      </p>
    </div>
  );
}
