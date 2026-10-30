"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { GoogleIcon } from "@/components/auth/google-icon";
import { PasswordField } from "@/components/auth/password-field";
import { FormAlert } from "@/components/shared/form-alert";
import { TextField } from "@/components/store/fields";
import { Button } from "@/components/ui/button";
import { loginAction, loginWithGoogleAction } from "@/lib/auth/actions";
import { INITIAL_AUTH_STATE } from "@/lib/auth/types";
import { type Locale } from "@/lib/i18n/config";
import { createTranslator } from "@/lib/i18n/translate";

export function LoginForm({
  locale,
  next,
  initialError,
  resetDone,
}: {
  locale: Locale;
  next?: string;
  initialError?: string | null;
  resetDone?: boolean;
}) {
  const t = createTranslator(locale);
  const [state, formAction, pending] = useActionState(
    loginAction,
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
          {t("auth.loginTitle")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("auth.loginSubtitle")}
        </p>
      </div>

      <div className="space-y-4">
        {resetDone && (
          <FormAlert tone="success">{t("auth.reset.success")}</FormAlert>
        )}
        {initialError && <FormAlert tone="error">{initialError}</FormAlert>}
        {state.error && <FormAlert tone="error">{state.error}</FormAlert>}
        {googleState.error && (
          <FormAlert tone="error">{googleState.error}</FormAlert>
        )}

        <form action={formAction} className="space-y-4" noValidate>
          {next ? <input type="hidden" name="next" value={next} /> : null}

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
            autoComplete="current-password"
            showLabel={t("auth.showPassword")}
            hideLabel={t("auth.hidePassword")}
            required
          />

          <p className="text-end text-sm">
            <Link
              href="/forgot-password"
              className="text-muted-foreground underline-offset-4 hover:underline"
            >
              {t("auth.forgotPassword")}
            </Link>
          </p>

          <Button type="submit" size="lg" className="w-full" disabled={pending}>
            {pending && (
              <Loader2 aria-hidden="true" data-icon="inline-start" className="animate-spin" />
            )}
            {t("auth.signIn")}
          </Button>
        </form>

        <form action={googleFormAction} className="space-y-3">
          {next ? <input type="hidden" name="next" value={next} /> : null}
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
        {t("auth.noAccount")}{" "}
        <Link
          href="/signup"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          {t("auth.createAccount")}
        </Link>
      </p>
    </div>
  );
}
