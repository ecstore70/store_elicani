"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { PostgrestError } from "@supabase/supabase-js";
import { requireUser } from "@/lib/auth/session";
import { isValidCountry } from "@/lib/countries";
import { isSupportedCurrency } from "@/lib/currency";
import { isSupportedLocale, normalizeLocale } from "@/lib/i18n/config";
import { getTranslator } from "@/lib/i18n/locale";
import type { Translator } from "@/lib/i18n/translate";
import { createClient } from "@/lib/supabase/server";
import {
  SLUG_MAX_LENGTH,
  SLUG_MESSAGE_KEYS,
  SLUG_MIN_LENGTH,
  validateSlug,
} from "./slug";
import {
  emptyStoreFormValues,
  type NewStore,
  type StoreFormField,
  type StoreFormState,
  type StoreFormValues,
} from "./types";

// ── padrões de validação ───────────────────────────────────────────────────
const WHATSAPP_PATTERN = /^\+?\d{7,15}$/;
const PHONE_CODE_PATTERN = /^\+[1-9]\d{0,4}$/;
const COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;
const TIMEZONE_PATTERN = /^[A-Za-z0-9_+\-/]{1,64}$/;
const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 80;
const DESCRIPTION_MAX_LENGTH = 500;

type FieldErrors = Partial<Record<StoreFormField, string>>;

/**
 * Normaliza um telefone para o formato do banco:
 * dígitos com "+" opcional — ex.: "+258841234567".
 * O "+" é aceito porque o país é informação separada (phone_country_code),
 * então nenhum formato de país é amarrado aqui.
 */
function normalizePhone(input: string): string {
  return input.trim().replace(/[\s\-().]/g, "");
}

function readFormValues(formData: FormData): StoreFormValues {
  const read = (field: StoreFormField): string =>
    String(formData.get(field) ?? "").trim();

  return {
    ...emptyStoreFormValues(),
    name: read("name"),
    slug: read("slug").toLowerCase(),
    whatsapp_number: read("whatsapp_number"),
    phone_country_code: read("phone_country_code"),
    country: read("country").toUpperCase(),
    language: read("language"),
    currency: read("currency").toUpperCase(),
    description: read("description"),
    timezone: read("timezone"),
    primary_color: read("primary_color"),
  };
}

/**
 * Valida todos os campos. As mensagens vêm do catálogo i18n, então o
 * mesmo código serve para qualquer idioma suportado.
 */
function validateStoreValues(
  values: StoreFormValues,
  t: Translator,
  options: { includeSlug: boolean },
): FieldErrors {
  const errors: FieldErrors = {};

  const name = values.name.trim();
  if (name.length < NAME_MIN_LENGTH) {
    errors.name = t("store.error.nameRequired");
  } else if (name.length > NAME_MAX_LENGTH) {
    errors.name = t("store.error.nameTooLong");
  }

  if (options.includeSlug) {
    const problem = validateSlug(values.slug);
    if (problem) {
      errors.slug = t(SLUG_MESSAGE_KEYS[problem], {
        min: SLUG_MIN_LENGTH,
        max: SLUG_MAX_LENGTH,
      });
    }
  }

  const whatsapp = normalizePhone(values.whatsapp_number);
  if (!WHATSAPP_PATTERN.test(whatsapp)) {
    errors.whatsapp_number = t("store.error.whatsappInvalid");
  }

  const phoneCode = values.phone_country_code.trim();
  if (phoneCode && !PHONE_CODE_PATTERN.test(phoneCode)) {
    errors.phone_country_code = t("store.error.phoneCodeInvalid");
  }

  if (values.country && !isValidCountry(values.country)) {
    errors.country = t("store.error.countryInvalid");
  }

  if (!isSupportedLocale(values.language)) {
    errors.language = t("store.error.languageInvalid");
  }

  if (!isSupportedCurrency(values.currency)) {
    errors.currency = t("store.error.currencyInvalid");
  }

  const timezone = values.timezone.trim();
  if (timezone && !TIMEZONE_PATTERN.test(timezone)) {
    errors.timezone = t("store.error.timezoneInvalid");
  }

  if (values.description.trim().length > DESCRIPTION_MAX_LENGTH) {
    errors.description = t("store.error.descriptionTooLong");
  }

  const color = values.primary_color.trim();
  if (color && !COLOR_PATTERN.test(color)) {
    errors.primary_color = t("store.error.primaryColorInvalid");
  }

  return errors;
}

/** Payload de atualização: não toca em slug nem owner_id. */
function toStoreUpdatePayload(
  values: StoreFormValues,
): Omit<NewStore, "owner_id" | "slug"> {
  return {
    name: values.name.trim(),
    whatsapp_number: normalizePhone(values.whatsapp_number) || null,
    phone_country_code: values.phone_country_code.trim() || null,
    country: values.country || null,
    language: normalizeLocale(values.language),
    currency: values.currency,
    description: values.description.trim() || null,
    timezone: values.timezone.trim() || null,
    primary_color: values.primary_color.trim() || null,
  };
}

function toStorePayload(values: StoreFormValues, ownerId: string): NewStore {
  return {
    owner_id: ownerId,
    slug: values.slug,
    ...toStoreUpdatePayload(values),
  };
}

/**
 * Traduz erros do banco em mensagens de usuário.
 * Nunca devolve detalhes internos (constraint, schema, SQL).
 */
function mapStoreError(
  error: PostgrestError,
  t: Translator,
  mode: "create" | "update",
): string {
  const message = error.message ?? "";

  if (error.code === "23505") {
    if (message.includes("stores_slug_key")) return t("store.error.slugTaken");
    if (message.includes("stores_owner_id_key")) return t("store.error.alreadyExists");
    return t("store.error.slugTaken");
  }

  // 42501: RLS recusou — 23503: FK falhou (usuário inexistente).
  if (error.code === "42501" || error.code === "23503") {
    return t("store.error.sessionInvalid");
  }

  return mode === "create"
    ? t("store.error.createFailed")
    : t("store.error.saveFailed");
}

function withValues(
  values: StoreFormValues,
  patch: Partial<Pick<StoreFormState, "error" | "notice" | "fieldErrors">>,
): StoreFormState {
  return {
    error: null,
    notice: null,
    fieldErrors: {},
    values,
    ...patch,
  };
}

/**
 * Cria a store do lojista autenticado.
 *
 * Segurança em duas camadas:
 *  1. RLS — `with check (auth.uid() = owner_id)` impede criar loja alheia;
 *  2. UNIQUE em owner_id — impede duas lojas para o mesmo lojista.
 */
export async function createStoreAction(
  _prevState: StoreFormState,
  formData: FormData,
): Promise<StoreFormState> {
  const user = await requireUser();
  const t = await getTranslator();
  const values = readFormValues(formData);

  const fieldErrors = validateStoreValues(values, t, { includeSlug: true });
  if (Object.keys(fieldErrors).length > 0) {
    return withValues(values, { fieldErrors });
  }

  const supabase = await createClient();

  // Pré-checagem de disponibilidade (UX). O RLS só devolve lojas ativas,
  // então a garantia final de unicidade é a constraint UNIQUE do banco.
  const { data: existing, error: lookupError } = await supabase
    .from("stores")
    .select("slug")
    .eq("slug", values.slug)
    .maybeSingle();

  if (lookupError) {
    return withValues(values, { error: t("store.error.lookupFailed") });
  }

  if (existing) {
    return withValues(values, { fieldErrors: { slug: t("store.error.slugTaken") } });
  }

  const { error: insertError } = await supabase
    .from("stores")
    .insert(toStorePayload(values, user.id));

  if (insertError) {
    return withValues(values, { error: mapStoreError(insertError, t, "create") });
  }

  revalidatePath("/app", "layout");
  redirect("/app");
}

/**
 * Atualiza a store do lojista autenticado (ecrã de definições).
 *
 * O RLS já limita o UPDATE às lojas próprias; o `.eq("owner_id", ...)` é
 * redundante de propósito — defesa em profundidade, nunca filtro só de UI.
 */
export async function updateStoreAction(
  _prevState: StoreFormState,
  formData: FormData,
): Promise<StoreFormState> {
  const user = await requireUser();
  const t = await getTranslator();
  const values = readFormValues(formData);

  const fieldErrors = validateStoreValues(values, t, { includeSlug: false });
  if (Object.keys(fieldErrors).length > 0) {
    return withValues(values, { fieldErrors });
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("stores")
    .update(toStoreUpdatePayload(values))
    .eq("owner_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return withValues(values, { error: mapStoreError(error, t, "update") });
  }

  if (!data) {
    // Nenhuma linha afetada: não existe store para este usuário.
    return withValues(values, { error: t("store.error.saveFailed") });
  }

  revalidatePath("/app", "layout");
  return withValues(values, { notice: t("settings.saved") });
}
