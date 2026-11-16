"use server";

import { revalidatePath, updateTag } from "next/cache";
import { cookies } from "next/headers";
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
import { ACTIVE_STORE_COOKIE } from "./active";
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
import { getStoresForOwner, requireStore } from "./queries";
import {
  emptyStoreFormValues,
  type FaqItemFormState,
  type NewStore,
  type PoliciesFormState,
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
    logo_url: read("logo_url"),
    favicon_url: read("favicon_url"),
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

  for (const field of [
    "logo_url",
    "favicon_url",
    "banner_url",
    "instagram_url",
    "facebook_url",
  ] as const) {
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
    logo_url: values.logo_url.trim() || null,
    favicon_url: values.favicon_url.trim() || null,
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
  if (error.code === "23505") {
    // Única 23505 possível em stores: slug duplicado. O UNIQUE de owner_id
    // saiu na migração multi-catalog — uma conta pode ter N lojas.
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

/**
 * Grava o cookie da loja ATIVA — o contexto explícito do painel.
 *
 * Escrito só no servidor (httpOnly); o valor é validado a cada leitura
 * contra a lista de lojas do próprio dono (ver pickActiveStore) — um id
 * forjado/expirado nunca muda o contexto para loja alheia.
 */
async function writeActiveStoreCookie(storeId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_STORE_COOKIE, storeId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
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
 * Cria uma store do lojista autenticado — a PRIMEIRA ou mais uma do
 * multi-catalog (o onboarding cria a primeira; /app/catalogs/new cria as
 * seguintes, sem conta nova).
 *
 * Segurança em três camadas:
 *  1. RLS — `with check (auth.uid() = owner_id)` impede criar loja alheia;
 *  2. Slug único global — bloqueado para todos, EXETO a exceção explícita
 *     do dono da plataforma (claim platform_owner em app_metadata, lida do
 *     token validado aqui no servidor — o formulário não envia essa flag);
 *  3. Loja recém-criada vira a ATIVA (cookie gravado aqui) — o painel
 *     entra direto no catálogo novo.
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

  const { data: inserted, error: insertError } = await supabase
    .from("stores")
    .insert(toStorePayload(values, user.id))
    .select("id")
    .single();

  if (insertError) {
    return withValues(values, { error: mapStoreError(insertError, t, "create") });
  }

  // Multi-catalog: a loja nova passa a ser a ATIVA (contexto explícito do
  // painel) e a lista cacheada é invalidada antes do redirect — senão o
  // dashboard serviria a lista fantasma até a janela de stale.
  await writeActiveStoreCookie(inserted.id);
  updateTag("store");
  revalidatePath("/app", "layout");
  redirect("/app");
}

/**
 * Atualiza a store ATIVA do lojista autenticado (ecrã de definições).
 *
 * Escopo explícito: `.eq("id", store.id)` da loja em contexto (multi-
 * catalog) — NUNCA "todas as lojas do dono". O RLS já limita o UPDATE às
 * lojas próprias; o `.eq("owner_id", ...)` repete o filtro (defesa em
 * profundidade, nunca só de UI).
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

  const store = await requireStore(user.id);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("stores")
    .update(toStoreUpdatePayload(values))
    .eq("id", store.id)
    .eq("owner_id", user.id)
    .select("id, slug")
    .maybeSingle();

  if (error) {
    return withValues(values, { error: mapStoreError(error, t, "update") });
  }

  if (!data) {
    // Nenhuma linha afetada: não existe store para este usuário.
    return withValues(values, { error: t("store.error.saveFailed") });
  }

  // Identidade mudou (logo/favicon/capa/textos): expira as leituras
  // cacheadas da loja (use-cache invalida por TAG, não por revalidatePath)
  // e limpa o router cache da vitrine para o novo branding aparecer já
  // na navegação do próprio comerciante.
  updateTag("store");
  revalidatePath("/app", "layout");
  revalidatePath(`/store/${data.slug}`);
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

  const store = await requireStore(user.id);
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
    .eq("id", store.id)
    .eq("owner_id", user.id)
    .select("id, slug")
    .maybeSingle();

  if (error) {
    return { error: t("store.error.saveFailed"), notice: null };
  }
  if (!data) {
    return { error: t("store.error.sessionInvalid"), notice: null };
  }

  // Aparência é identidade da loja: mesma invalidação de updateStoreAction
  // (tag "store" para o use-cache + router cache da vitrine).
  updateTag("store");
  revalidatePath("/app", "layout");
  revalidatePath(`/store/${data.slug}`);
  return { error: null, notice: t("appearance.saved") };
}

// ── ciclo de vida do catálogo ─────────────────────────────────────────────
//
// NESTA ARQUITETURA A LOJA É O CATÁLOGO (não existe tabela `stores` separada
// de `catalogs`): ativar/desativar altera `stores.is_active` e apagar apaga a
// própria linha da loja — o cascata remove APENAS products, categories e
// product_media desta loja (FKs `on delete cascade`). profiles e auth NÃO são
// tocados: as FKs apontam de stores → profiles, nunca ao contrário — apagar
// um catálogo não apaga a conta nem afeta as outras lojas do dono.
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
 * antes do cliente mostrar o feedback de sucesso). O cliente usa o
 * `remainingStores` devolvido: sem lojas → /app/onboarding?deleted=1
 * (banner de sucesso); com outras lojas → /app/catalogs (lista atualizada —
 * o contexto ativa cai na fallback determinística, sempre loja do dono).
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

  // Multi-catalog: quantas lojas restam na conta? Lido DEPOIS do
  // updateTag — a lista volta do banco, não do cache.
  const remaining = await getStoresForOwner(user.id);
  return { ok: true, error: null, remainingStores: remaining.length };
}

/**
 * Troca a loja ATIVA do painel (multi-catalog) — o contexto explícito de
 * todas as operações do dashboard (produtos, encomendas, definições,
 * políticas…).
 *
 * A posse é validada AQUI: o cookie só grava se a loja pertencer ao
 * utilizador autenticado (filtro por id + owner_id; RLS repete no banco).
 * Id alheio ou inexistente → volta ao dashboard sem trocar de contexto.
 *
 * `revalidatePath("/app", "layout")` + redirect: a navegação seguinte já
 * renderiza com o novo cookie — o nome da loja ativa muda na barra lateral
 * e todas as páginas passam a servir a loja escolhida.
 */
export async function setActiveStoreAction(storeId: string): Promise<void> {
  const user = await requireUser();

  const supabase = await createClient();
  const { data } = await supabase
    .from("stores")
    .select("id")
    .eq("id", storeId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!data) {
    redirect("/app");
  }

  await writeActiveStoreCookie(storeId);
  revalidatePath("/app", "layout");
  redirect("/app");
}

// ── políticas da loja (terms / privacy) ────────────────────────────────────

/** Limite de caracteres por texto de política (o textarea impõe o mesmo). */
const POLICY_MAX_LENGTH = 20000;
/** Limites de FAQ — casam exatamente com os CHECKs de store_faq_items. */
const FAQ_QUESTION_MAX_LENGTH = 300;
const FAQ_ANSWER_MAX_LENGTH = 5000;

/**
 * Grava os textos de políticas da loja ATIVA (terms / privacy_policy) —
 * conteúdo do COMERCIANTE em texto puro (sem HTML: a vitrine renderiza
 * com `whitespace-pre-wrap`).
 *
 * Segurança (multi-catalog): o escopo é a loja em contexto —
 * `.eq("id", store.id)` da loja ativa + RLS do dono. Alternar de catálogo
 * no painel é o que decide QUEM texto é gravado; as lojas nunca partilham
 * nem sobrescrevem conteúdo umas das outras. Limites validados aqui.
 * `updateTag("store")` expira o cache use-cache da loja (o editor e o
 * rodapé da vitrine mostram o novo conteúdo já na navegação seguinte).
 */
export async function updateStorePoliciesAction(
  _prevState: PoliciesFormState,
  formData: FormData,
): Promise<PoliciesFormState> {
  const user = await requireUser();
  const t = await getTranslator();

  const terms = String(formData.get("terms") ?? "").trim();
  const privacyPolicy = String(formData.get("privacy_policy") ?? "").trim();
  const values = { terms, privacy_policy: privacyPolicy };

  const fieldErrors: PoliciesFormState["fieldErrors"] = {};
  if (terms.length > POLICY_MAX_LENGTH) {
    fieldErrors.terms = t("settings.policyTooLong");
  }
  if (privacyPolicy.length > POLICY_MAX_LENGTH) {
    fieldErrors.privacy_policy = t("settings.policyTooLong");
  }
  if (Object.keys(fieldErrors).length > 0) {
    return { error: null, notice: null, fieldErrors, values };
  }

  const store = await requireStore(user.id);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("stores")
    .update({ terms, privacy_policy: privacyPolicy })
    .eq("id", store.id)
    .eq("owner_id", user.id)
    .select("id, slug")
    .maybeSingle();

  if (error || !data) {
    return {
      error: t("store.error.saveFailed"),
      notice: null,
      fieldErrors: {},
      values,
    };
  }

  updateTag("store");
  revalidatePath("/app", "layout");
  revalidatePath(`/store/${data.slug}`);
  revalidatePath(`/store/${data.slug}/terms`);
  revalidatePath(`/store/${data.slug}/privacy`);
  return { error: null, notice: t("settings.saved"), fieldErrors: {}, values };
}

// ── FAQ da loja (store_faq_items) ──────────────────────────────────────────

type FaqValues = { question: string; answer: string };

function readFaqValues(formData: FormData): FaqValues {
  return {
    question: String(formData.get("question") ?? "").trim(),
    answer: String(formData.get("answer") ?? "").trim(),
  };
}

/** Obrigatório + limites do CHECK — mensagens do catálogo i18n. */
function validateFaqValues(
  values: FaqValues,
  t: Translator,
): FaqItemFormState["fieldErrors"] {
  const fieldErrors: FaqItemFormState["fieldErrors"] = {};
  if (!values.question) {
    fieldErrors.question = t("faq.questionRequired");
  } else if (values.question.length > FAQ_QUESTION_MAX_LENGTH) {
    fieldErrors.question = t("settings.policyTooLong");
  }
  if (!values.answer) {
    fieldErrors.answer = t("faq.answerRequired");
  } else if (values.answer.length > FAQ_ANSWER_MAX_LENGTH) {
    fieldErrors.answer = t("settings.policyTooLong");
  }
  return fieldErrors;
}

function faqState(
  patch: Partial<FaqItemFormState>,
): FaqItemFormState {
  return { error: null, notice: null, fieldErrors: {}, ...patch };
}

/** Limpa o router cache da página pública de FAQ (rodapé + página). */
function revalidateStoreFaq(slug: string): void {
  revalidatePath(`/store/${slug}/faq`);
}

/**
 * Cria uma pergunta no FIM da lista da loja (sort_order = maior + 1).
 * `store_id` vem do `requireStore` do PRÓPIO usuário — o RLS e o eq
 * garantem que só a loja do editor é alcançável.
 */
export async function createFaqItemAction(
  _prevState: FaqItemFormState,
  formData: FormData,
): Promise<FaqItemFormState> {
  const user = await requireUser();
  const t = await getTranslator();
  const store = await requireStore(user.id);

  const values = readFaqValues(formData);
  const fieldErrors = validateFaqValues(values, t);
  if (Object.keys(fieldErrors).length > 0) {
    return faqState({ fieldErrors });
  }

  const supabase = await createClient();

  const { data: last, error: lastError } = await supabase
    .from("store_faq_items")
    .select("sort_order")
    .eq("store_id", store.id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastError) {
    return faqState({ error: t("store.error.saveFailed") });
  }

  const { error } = await supabase.from("store_faq_items").insert({
    store_id: store.id,
    question: values.question,
    answer: values.answer,
    sort_order: (last?.sort_order ?? -1) + 1,
  });

  if (error) {
    return faqState({ error: t("store.error.saveFailed") });
  }

  revalidateStoreFaq(store.slug);
  return faqState({ notice: t("faq.saved") });
}

/** Atualiza pergunta/resposta de um item da PRÓPRIA loja. */
export async function updateFaqItemAction(
  itemId: string,
  _prevState: FaqItemFormState,
  formData: FormData,
): Promise<FaqItemFormState> {
  const user = await requireUser();
  const t = await getTranslator();
  const store = await requireStore(user.id);

  const values = readFaqValues(formData);
  const fieldErrors = validateFaqValues(values, t);
  if (Object.keys(fieldErrors).length > 0) {
    return faqState({ fieldErrors });
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("store_faq_items")
    .update({ question: values.question, answer: values.answer })
    .eq("store_id", store.id)
    .eq("id", itemId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return faqState({ error: t("store.error.saveFailed") });
  }

  revalidateStoreFaq(store.slug);
  return faqState({ notice: t("faq.saved") });
}

/** Remove uma pergunta da própria loja (confirmação fica na UI). */
export async function deleteFaqItemAction(itemId: string): Promise<void> {
  const user = await requireUser();
  const store = await requireStore(user.id);

  const supabase = await createClient();
  const { error } = await supabase
    .from("store_faq_items")
    .delete()
    .eq("store_id", store.id)
    .eq("id", itemId);

  if (error) {
    throw new Error(`Failed to delete FAQ item: ${error.message}`);
  }

  revalidateStoreFaq(store.slug);
}

/** Move uma pergunta uma posição (mecanismo simples ↑/↓, como categorias). */
export async function moveFaqItemAction(
  itemId: string,
  direction: "up" | "down",
): Promise<void> {
  const user = await requireUser();
  const store = await requireStore(user.id);

  const supabase = await createClient();
  const { data: items, error } = await supabase
    .from("store_faq_items")
    .select("id, sort_order, created_at")
    .eq("store_id", store.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error || !items) {
    throw new Error(`Failed to load FAQ items: ${error?.message}`);
  }

  const index = items.findIndex((item) => item.id === itemId);
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || targetIndex < 0 || targetIndex >= items.length) return;

  const current = items[index];
  const target = items[targetIndex];

  const first = await supabase
    .from("store_faq_items")
    .update({ sort_order: target.sort_order })
    .eq("store_id", store.id)
    .eq("id", current.id);

  if (first.error) {
    throw new Error(`Failed to reorder FAQ items: ${first.error.message}`);
  }

  const second = await supabase
    .from("store_faq_items")
    .update({ sort_order: current.sort_order })
    .eq("store_id", store.id)
    .eq("id", target.id);

  if (second.error) {
    throw new Error(`Failed to reorder FAQ items: ${second.error.message}`);
  }

  revalidateStoreFaq(store.slug);
}
