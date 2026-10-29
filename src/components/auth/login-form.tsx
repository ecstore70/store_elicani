"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { FormAlert } from "@/components/shared/form-alert";
import { TextField } from "@/components/store/fields";
import { Button } from "@/components/ui/button";
import { loginAction } from "@/lib/auth/actions";
import { INITIAL_AUTH_STATE } from "@/lib/auth/types";
import { type Locale } from "@/lib/i18n/config";
import { createTranslator } from "@/lib/i18n/translate";

export function LoginForm({ locale, next }: { locale: Locale; next?: string }) {
  const t = createTranslator(locale);
  const [state, formAction, pending] = useActionState(
    loginAction,
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

      <form action={formAction} className="space-y-4" noValidate>
        {next ? <input type="hidden" name="next" value={next} /> : null}

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

        <TextField
          label={t("auth.password")}
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />

        <p className="text-right text-sm">
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
