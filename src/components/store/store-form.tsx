"use client";

import { useActionState, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { FormAlert } from "@/components/shared/form-alert";
import {
  FormSection,
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/store/fields";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createStoreAction, updateStoreAction } from "@/lib/stores/actions";
import { getCountries } from "@/lib/countries";
import {
  formatCurrency,
  getCurrencyLabel,
  SUPPORTED_CURRENCIES,
} from "@/lib/currency";
import {
  LOCALE_LABELS,
  SUPPORTED_LOCALES,
  type Locale,
} from "@/lib/i18n/config";
import { createTranslator } from "@/lib/i18n/translate";
import { getStoreDomain } from "@/lib/stores/resolve";
import { slugify } from "@/lib/stores/slug";
import {
  emptyStoreFormValues,
  type StoreFormState,
  type StoreFormValues,
} from "@/lib/stores/types";

const INITIAL_STATE: StoreFormState = {
  error: null,
  notice: null,
  fieldErrors: {},
  values: emptyStoreFormValues(),
};

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

/** Exemplo de valor monetário — rótulo de formatação, nunca dado real. */
const CURRENCY_EXAMPLE = 1234.56;

/**
 * Formulário de loja, usado no onboarding (create) e nas definições (update).
 *
 * Um único componente mantém validação, i18n, estados de carregamento e
 * regras de domínio idênticos nos dois ecrãs; `mode` só altera o que cada
 * ecrã expõe (endereço e cor só aparecem onde fazem sentido).
 */
export function StoreForm({
  locale,
  mode,
  initialValues,
  storeSlug,
}: {
  locale: Locale;
  mode: "create" | "update";
  initialValues?: Partial<StoreFormValues>;
  storeSlug?: string;
}) {
  const t = createTranslator(locale);
  const action = mode === "create" ? createStoreAction : updateStoreAction;
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);

  const [values, setValues] = useState<StoreFormValues>(() => ({
    ...emptyStoreFormValues(),
    ...initialValues,
  }));
  const [slugEdited, setSlugEdited] = useState(false);

  const countries = useMemo(
    () =>
      getCountries(locale).map((country) => ({
        value: country.code,
        label: country.name,
      })),
    [locale],
  );

  const languages = useMemo(
    () =>
      SUPPORTED_LOCALES.map((code) => ({
        value: code,
        label: LOCALE_LABELS[code],
      })),
    [],
  );

  const currencies = useMemo(
    () =>
      SUPPORTED_CURRENCIES.map((currency) => ({
        value: currency.code,
        label: `${currency.code} — ${getCurrencyLabel(currency.code, locale)}`,
      })),
    [locale],
  );

  // 418 fusos IANA. Quando o runtime não expõe a lista, o campo continua
  // validado no servidor pelo CHECK do banco (apenas formato).
  const timezones = useMemo(() => {
    try {
      if (typeof Intl.supportedValuesOf !== "function") return [];
      return Intl.supportedValuesOf("timeZone").map((zone) => ({
        value: zone,
        label: zone,
      }));
    } catch {
      return [];
    }
  }, []);

  function update<K extends keyof StoreFormValues>(
    key: K,
    value: StoreFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  const previewColor = HEX_COLOR_PATTERN.test(values.primary_color.trim())
    ? values.primary_color.trim()
    : null;

  return (
    <form action={formAction} className="space-y-8" noValidate>
      {state.error && <FormAlert tone="error">{state.error}</FormAlert>}
      {state.notice && <FormAlert tone="success">{state.notice}</FormAlert>}

      <FormSection title={t("settings.sectionStore")}>
        <TextField
          className="sm:col-span-2"
          label={t("onboarding.name")}
          name="name"
          value={values.name}
          onChange={(event) => {
            const nextName = event.target.value;
            setValues((current) => ({
              ...current,
              name: nextName,
              // O endereço acompanha o nome até a pessoa editar manualmente.
              slug: mode === "create" && !slugEdited ? slugify(nextName) : current.slug,
            }));
          }}
          placeholder={t("onboarding.namePlaceholder")}
          autoComplete="organization"
          error={state.fieldErrors.name}
          required
        />

        {mode === "create" ? (
          <TextField
            className="sm:col-span-2"
            label={t("onboarding.slug")}
            name="slug"
            value={values.slug}
            onChange={(event) => {
              setSlugEdited(true);
              update("slug", event.target.value.toLowerCase());
            }}
            placeholder={t("onboarding.slugPlaceholder")}
            hint={t("onboarding.slugHelp", {
              url: `${values.slug || "your-store"}.${getStoreDomain()}`,
            })}
            error={state.fieldErrors.slug}
            spellCheck={false}
            autoCapitalize="none"
            autoCorrect="off"
            required
          />
        ) : (
          <div className="space-y-1.5 sm:col-span-2">
            <Label>{t("dashboard.slug")}</Label>
            <div className="flex h-8 items-center rounded-lg border border-border/70 bg-muted/40 px-2.5 font-mono text-sm text-muted-foreground">
              {storeSlug ?? values.slug}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("settings.slugImmutable")}
            </p>
          </div>
        )}
      </FormSection>

      <FormSection title={t("settings.sectionLocalization")}>
        <SelectField
          label={t("onboarding.country")}
          name="country"
          value={values.country}
          onChange={(event) => update("country", event.target.value)}
          options={countries}
          placeholder={t("onboarding.selectPlaceholder")}
          error={state.fieldErrors.country}
        />

        <SelectField
          label={t("onboarding.language")}
          name="language"
          value={values.language}
          onChange={(event) => update("language", event.target.value)}
          options={languages}
          placeholder={t("onboarding.selectPlaceholder")}
          hint={t("onboarding.languageHelp")}
          error={state.fieldErrors.language}
          required
        />

        <SelectField
          className="sm:col-span-2"
          label={t("onboarding.currency")}
          name="currency"
          value={values.currency}
          onChange={(event) => update("currency", event.target.value)}
          options={currencies}
          placeholder={t("onboarding.selectPlaceholder")}
          error={state.fieldErrors.currency}
          required
        />

        {mode === "update" && values.currency && (
          <p className="text-xs text-muted-foreground sm:col-span-2">
            {t("settings.currencyPreview", {
              value: formatCurrency(CURRENCY_EXAMPLE, values.currency, locale),
            })}
          </p>
        )}
      </FormSection>

      <FormSection title={t("settings.sectionContact")}>
        <TextField
          label={t("onboarding.whatsapp")}
          name="whatsapp_number"
          value={values.whatsapp_number}
          onChange={(event) => update("whatsapp_number", event.target.value)}
          placeholder={t("onboarding.whatsappPlaceholder")}
          hint={t("onboarding.whatsappHelp")}
          inputMode="tel"
          autoComplete="tel"
          error={state.fieldErrors.whatsapp_number}
          required
        />

        <TextField
          label={t("onboarding.phoneCountryCode")}
          name="phone_country_code"
          value={values.phone_country_code}
          onChange={(event) => update("phone_country_code", event.target.value)}
          placeholder={t("onboarding.phoneCountryCodePlaceholder")}
          hint={t("common.optional")}
          inputMode="numeric"
          error={state.fieldErrors.phone_country_code}
        />
      </FormSection>

      <FormSection title={t("store.sectionOptional")}>
        <TextAreaField
          className="sm:col-span-2"
          label={t("onboarding.description")}
          name="description"
          value={values.description}
          onChange={(event) => update("description", event.target.value)}
          placeholder={t("onboarding.descriptionPlaceholder")}
          maxLength={500}
          error={state.fieldErrors.description}
        />

        {timezones.length > 0 ? (
          <SelectField
            label={t("onboarding.timezone")}
            name="timezone"
            value={values.timezone}
            onChange={(event) => update("timezone", event.target.value)}
            options={timezones}
            placeholder={t("onboarding.none")}
            error={state.fieldErrors.timezone}
          />
        ) : (
          <TextField
            label={t("onboarding.timezone")}
            name="timezone"
            value={values.timezone}
            onChange={(event) => update("timezone", event.target.value)}
            placeholder={t("onboarding.timezonePlaceholder")}
            error={state.fieldErrors.timezone}
          />
        )}

        {mode === "update" && (
          <div className="flex items-end gap-3 sm:col-span-2">
            <TextField
              className="flex-1"
              label={t("settings.primaryColor")}
              name="primary_color"
              value={values.primary_color}
              onChange={(event) => update("primary_color", event.target.value)}
              placeholder="#0f172a"
              spellCheck={false}
              autoCapitalize="none"
              error={state.fieldErrors.primary_color}
            />
            <span
              aria-hidden="true"
              className="mb-0.5 size-8 shrink-0 rounded-lg border border-border/70"
              style={{ backgroundColor: previewColor ?? "transparent" }}
            />
          </div>
        )}
      </FormSection>

      {mode === "update" && (
        <FormSection
          title={t("settings.sectionStorefront")}
          description={t("settings.sectionStorefrontHelp")}
        >
          <TextField
            className="sm:col-span-2"
            label={t("settings.bannerUrl")}
            name="banner_url"
            value={values.banner_url}
            onChange={(event) => update("banner_url", event.target.value)}
            placeholder="https://…"
            hint={t("common.optional")}
            inputMode="url"
            autoCapitalize="none"
            spellCheck={false}
            error={state.fieldErrors.banner_url}
          />

          <TextAreaField
            className="sm:col-span-2"
            label={t("settings.openingHours")}
            name="opening_hours"
            value={values.opening_hours}
            onChange={(event) => update("opening_hours", event.target.value)}
            placeholder={t("settings.openingHoursPlaceholder")}
            hint={t("common.optional")}
            maxLength={300}
            error={state.fieldErrors.opening_hours}
          />

          <TextField
            label={t("settings.instagramUrl")}
            name="instagram_url"
            value={values.instagram_url}
            onChange={(event) => update("instagram_url", event.target.value)}
            placeholder="https://instagram.com/…"
            hint={t("common.optional")}
            inputMode="url"
            autoCapitalize="none"
            spellCheck={false}
            error={state.fieldErrors.instagram_url}
          />

          <TextField
            label={t("settings.facebookUrl")}
            name="facebook_url"
            value={values.facebook_url}
            onChange={(event) => update("facebook_url", event.target.value)}
            placeholder="https://facebook.com/…"
            hint={t("common.optional")}
            inputMode="url"
            autoCapitalize="none"
            spellCheck={false}
            error={state.fieldErrors.facebook_url}
          />
        </FormSection>
      )}

      <div className="flex justify-end border-t border-border/70 pt-6">
        <Button type="submit" size="lg" disabled={pending}>
          {pending && (
            <Loader2 aria-hidden="true" data-icon="inline-start" className="animate-spin" />
          )}
          {mode === "create"
            ? pending
              ? t("onboarding.submitting")
              : t("onboarding.submit")
            : pending
              ? t("settings.saving")
              : t("settings.save")}
        </Button>
      </div>
    </form>
  );
}
