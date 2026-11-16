"use client";

import { useActionState } from "react";
import { FormAlert } from "@/components/shared/form-alert";
import { Button } from "@/components/ui/button";
import { TextAreaField } from "@/components/store/fields";
import { updateStorePoliciesAction } from "@/lib/stores/actions";
import type { PoliciesFormState } from "@/lib/stores/types";
import type { Locale } from "@/lib/i18n/config";
import { createTranslator } from "@/lib/i18n/translate";

/**
 * Formulário de POLÍTICAS da loja (terms / privacy_policy) — Card
 * "Policies & FAQ" das definições.
 *
 * Texto PURO em `TextAreaField` (o produto não tem editor rich-text;
 * a vitrine renderiza com `whitespace-pre-wrap`). Ação própria
 * (`updateStorePoliciesAction`) — separada do formulário principal de
 * loja para o comerciante poder gravar sem tocar nos outros campos.
 */
export function PoliciesForm({
  locale,
  initialValues,
}: {
  locale: Locale;
  initialValues: { terms: string; privacy_policy: string };
}) {
  const t = createTranslator(locale);
  const [state, formAction, pending] = useActionState<PoliciesFormState, FormData>(
    updateStorePoliciesAction,
    { error: null, notice: null, fieldErrors: {}, values: initialValues },
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-4">
        <TextAreaField
          label={t("settings.termsLabel")}
          name="terms"
          defaultValue={initialValues.terms}
          placeholder={t("settings.termsPlaceholder")}
          maxLength={20000}
          rows={6}
          disabled={pending}
          error={state.fieldErrors.terms}
        />
        <TextAreaField
          label={t("settings.privacyLabel")}
          name="privacy_policy"
          defaultValue={initialValues.privacy_policy}
          placeholder={t("settings.privacyPlaceholder")}
          maxLength={20000}
          rows={6}
          disabled={pending}
          error={state.fieldErrors.privacy_policy}
        />
      </div>

      {state.error && <FormAlert tone="error">{state.error}</FormAlert>}
      {state.notice && <FormAlert tone="success">{state.notice}</FormAlert>}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? t("settings.saving") : t("settings.save")}
        </Button>
      </div>
    </form>
  );
}
