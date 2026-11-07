"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import type { PostgrestError } from "@supabase/supabase-js";
import { isPlatformOwner } from "@/lib/auth/platform";
import { requireUser } from "@/lib/auth/session";
import { isValidCountry } from "@/lib/countries";
import { isSupportedCurrency } from "@/lib/currency";
import { MEDIA_BUCKET } from "@/lib/catalog/media";
import { isSupportedLocale, normalizeLocale } from "@/lib/i18n/config";
import { getTranslator } from "@/lib/i18n/locale";
import type { Translator } from "@/lib/i18n/translate";
import { createClient } from "@/lib/supabase/server";
import {
  BUTTON_STYLES,
  CARD_STYLES,
  IMAGE_RATIOS,
  PRODUCT_LAYOUTS,
  STORE_TEMPLATES,
  isOneOf,
  isValidHexColor,
} from "./appearance";
import { isCatalogDeleteConfirmation, type CatalogActionResult } from "./lifecycle";
import {
  SLUG_MAX_LENGTH,
  SLUG_MESSAGE_KEYS,
  SLUG_MIN_LENGTH,
  validateSlugForCreation,
} from "./slug";
import { requireStore } from "./queries";
import {
  emptyStoreFormValues,
  type NewStore,
  type StoreFormField,
  type StoreFormState,
  type StoreFormValues,
} from "./types";
import type { AppearanceFormState } from "@/lib/catalog/types";

// ── padrões de validação ───────────────────────────────────────────────────
const WHATSAPP_PATTERN = /^\+?\d{7,15}$/;
const PHONE_CODE_PATTERN = /^\+[1-9]\d{0,4}$/;
const COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;
const TIMEZONE_PATTERN = /^[A-Za-z0-9_+\-/]{1,64}$/;
const URL_PATTERN = /^https?:\/\/\S{4,2048}$/;
const OPENING_HOURS_MAX_LENGTH = 300;
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
    banner_url: read("banner_url"),
    opening_hours: read("opening_hours"),
    instagram_url: read("instagram_url"),
    facebook_url: read("facebook_url"),
  };
}

/**
 * Valida todos os campos. As mensagens vêm do catálogo i18n, então o
 * mesmo código serve para qualquer idioma suportado.
 */
function validateStoreValues(
  values: StoreFormValues,
  t: Translator,
  options: { includeSlug: boolean; isPlatformOwner?: boolean },
): FieldErrors {
  const errors: FieldErrors = {};

  const name = values.name.trim();
  if (name.length < NAME_MIN_LENGTH) {
    errors.name = t("store.error.nameRequired");
  } else if (name.length > NAME_MAX_LENGTH) {
    errors.name = t("store.error.nameTooLong");
  }

  if (options.includeSlug) {
    const problem = validateSlugForCreation(
      values.slug,
      options.isPlatformOwner === true,
    );
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

  for (const field of ["banner_url", "instagram_url", "facebook_url"] as const) {
    const url = values[field].trim();
    if (url && !URL_PATTERN.test(url)) {
      errors[field] = t("store.error.urlInvalid");
    }
  }

  if (values.opening_hours.trim().length > OPENING_HOURS_MAX_LENGTH) {
    errors.opening_hours = t("store.error.openingHoursTooLong");
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
    banner_url: values.banner_url.trim() || null,
    opening_hours: values.opening_hours.trim() || null,
    instagram_url: values.instagram_url.trim() || null,
    facebook_url: values.facebook_url.trim() || null,
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
 * Segurança em três camadas:
 *  1. RLS — `with check (auth.uid() = owner_id)` impede criar loja alheia;
 *  2. UNIQUE em owner_id — impede duas lojas para o mesmo lojista;
 *  3. Slug reservado — bloqueado para todos, EXETO a exceção explícita do
 *     dono da plataforma (claim platform_owner em app_metadata, lida do
 *     token validado aqui no servidor — o formulário não envia essa flag).
 */
export async function createStoreAction(
  _prevState: StoreFormState,
  formData: FormData,
): Promise<StoreFormState> {
  const user = await requireUser();
  const t = await getTranslator();
  const values = readFormValues(formData);

  const fieldErrors = validateStoreValues(values, t, {
    includeSlug: true,
    isPlatformOwner: isPlatformOwner(user),
  });
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

// ── aparência da vitrine ──────────────────────────────────────────────────

/**
 * Grava a aparência da vitrine (template, cores, layout, estilos).
 *
 * Customização CONTROLADA: os valores vêm de listas fechadas validadas
 * aqui no servidor (e de novo pelo CHECK do banco). Nada de CSS/HTML
 * arbitrário — a estrutura da vitrine é sempre a Elicani.
 */
export async function updateAppearanceAction(
  _prevState: AppearanceFormState,
  formData: FormData,
): Promise<AppearanceFormState> {
  const user = await requireUser();
  const t = await getTranslator();

  const read = (name: string): string =>
    String(formData.get(name) ?? "").trim();

  const template = read("template");
  const product_layout = read("product_layout");
  const image_ratio = read("image_ratio");
  const button_style = read("button_style");
  const card_style = read("card_style");

  if (
    !isOneOf(template, STORE_TEMPLATES) ||
    !isOneOf(product_layout, PRODUCT_LAYOUTS) ||
    !isOneOf(image_ratio, IMAGE_RATIOS) ||
    !isOneOf(button_style, BUTTON_STYLES) ||
    !isOneOf(card_style, CARD_STYLES)
  ) {
    return { error: t("appearance.error.optionInvalid"), notice: null };
  }

  const color = (name: string): string | null => {
    const value = read(name);
    if (!value) return null;
    return isValidHexColor(value) ? value.toLowerCase() : null;
  };

  const primary_color = color("primary_color");
  const button_color = color("button_color");
  const accent_color = color("accent_color");
  const background_color = color("background_color");

  if (
    (read("primary_color") && !primary_color) ||
    (read("button_color") && !button_color) ||
    (read("accent_color") && !accent_color) ||
    (read("background_color") && !background_color)
  ) {
    return { error: t("appearance.error.colorInvalid"), notice: null };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("stores")
    .update({
      template,
      product_layout,
      image_ratio,
      button_style,
      card_style,
      primary_color,
      button_color,
      accent_color,
      background_color,
    })
    .eq("owner_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return { error: t("store.error.saveFailed"), notice: null };
  }
  if (!data) {
    return { error: t("store.error.sessionInvalid"), notice: null };
  }

  revalidatePath("/app", "layout");
  return { error: null, notice: t("appearance.saved") };
}

// ── ciclo de vida do catálogo ─────────────────────────────────────────────
//
// NESTA ARQUITETURA A LOJA É O CATÁLOGO (não existe tabela `stores` separada
// de `catalogs`): ativar/desativar altera `stores.is_active` e apagar apaga a
// própria linha da loja — o cascata remove APENAS products, categories e
// product_media desta loja (FKs `on delete cascade`). profiles e auth NÃO são
// tocados: as FKs apontam de stores → profiles, nunca ao contrário, e o
// `owner_id UNIQUE` liberta-se para o lojista recriar outra loja depois.
//
// O tipo de resultado (`CatalogActionResult`) vive em ./lifecycle — módulo
// puro compartilhado com a UI e com os testes.

/**
 * Revalida as rotas afetadas por uma mudança de ESTADO do catálogo.
 * Chamado só enquanto a loja existe (ativar/desativar) — a revalidação do
 * caminho atual é o que faz o badge atualizar na mesma resposta da action.
 */
function revalidateCatalogState(storeSlug: string): void {
  revalidatePath("/app", "layout");
  revalidatePath("/app/catalog");
  revalidatePath("/app/products");
  revalidatePath("/app/categories");
  revalidatePath(`/store/${storeSlug}`);
  revalidatePath("/", "layout");
}

/**
 * Ativa ou desativa o catálogo (visibilidade pública) da PRÓPRIA loja.
 *
 * Enforce SERVER-SIDE: o estado é gravado no Supabase — o RLS público
 * (`stores_public_select_active`) esconde a loja inativa da vitrine e o
 * proxy passa a servir o estado indisponível. Nada aqui é só de UI.
 *
 * Defesa em profundidade: RLS já restringe às lojas próprias, e o
 * `.eq("owner_id", user.id)` repete o filtro aqui (nunca só de UI).
 */
export async function setCatalogActiveAction(
  active: boolean,
): Promise<CatalogActionResult> {
  const user = await requireUser();
  const t = await getTranslator();
  const store = await requireStore(user.id);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("stores")
    .update({ is_active: active })
    .eq("id", store.id)
    .eq("owner_id", user.id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: t("catalog.saveFailed") };
  }

  // A store mudou em TODAS as páginas: expira a entrada use-cache (tag
  // "store") e revalida as rotas — painel e vitrine refletem na hora.
  updateTag("store");
  revalidateCatalogState(store.slug);
  return { ok: true, error: null };
}

/**
 * Limpeza best-effort dos ficheiros da loja nos buckets públicos.
 *
 * ANTES do delete da linha: as políticas de storage dependem dela
 * (`owns_store_folder` verifica a existência da loja). Se falhar, o delete
 * continua na mesma — arquivos órfãos em URL pública sem ligação é o menor
 * dos mals, nunca um catálogo partido a meio. Falha nunca é lançada.
 */
async function cleanupStoreFiles(
  supabase: Awaited<ReturnType<typeof createClient>>,
  storeId: string,
): Promise<void> {
  const STORE_LOGOS_BUCKET = "store-logos";

  for (const bucket of [MEDIA_BUCKET, STORE_LOGOS_BUCKET]) {
    try {
      const paths: string[] = [];
      let offset = 0;
      for (let page = 0; page < 20; page++) {
        const { data, error } = await supabase.storage
          .from(bucket)
          .list(storeId, { limit: 100, offset });
        if (error || !data || data.length === 0) break;
        // `id` nulo = subpasta (não existe nos nossos uploads, mas por via
        // das dúvidas só levamos ficheiros).
        paths.push(
          ...data.filter((entry) => entry.id).map((entry) => `${storeId}/${entry.name}`),
        );
        if (data.length < 100) break;
        offset += 100;
      }
      for (let i = 0; i < paths.length; i += 100) {
        await supabase.storage.from(bucket).remove(paths.slice(i, i + 100));
      }
    } catch {
      // best-effort: erro de storage nunca impede a exclusão do catálogo.
    }
  }
}

/**
 * Apaga o catálogo da própria loja — exclusão destrutiva REAL.
 *
 * A confirmação digitada é validada AQUI também (defesa em profundidade):
 * o cliente só habilita o botão final com a palavra exata, e o servidor
 * exige-a de volta — contornar a UI não apaga nada.
 *
 * Ordem: limpeza de storage (best-effort, depende da linha) → delete da
 * linha (cascata no banco) → invalidação do cache. Sem `revalidatePath` da
 * rota atual nem dos layouts: a resposta da action NÃO deve re-renderizar
 * /app/catalog (o layout exigiria a loja que já não existe e redirecionaria
 * antes do cliente mostrar o feedback de sucesso). O cliente encaminha para
 * /app/onboarding?deleted=1 com a loja do cache já expirada (updateTag).
 */
export async function deleteCatalogAction(
  confirmation: string,
): Promise<CatalogActionResult> {
  const user = await requireUser();
  const t = await getTranslator();

  if (!isCatalogDeleteConfirmation(confirmation)) {
    return { ok: false, error: t("catalog.deleteFailed") };
  }

  const store = await requireStore(user.id);
  const supabase = await createClient();

  await cleanupStoreFiles(supabase, store.id);

  const { data, error } = await supabase
    .from("stores")
    .delete()
    .eq("id", store.id)
    .eq("owner_id", user.id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: t("catalog.deleteFailed") };
  }

  // Sem isto o onboarding leria a loja fantasma do cache use-cache e
  // redirecionaria de volta para o dashboard por até a janela de stale.
  updateTag("store");
  revalidatePath("/app/products");
  revalidatePath("/app/categories");
  revalidatePath(`/store/${store.slug}`);
  return { ok: true, error: null };
}
