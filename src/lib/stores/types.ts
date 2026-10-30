import type { Database } from "@/lib/database.types";

/** Linhas das tabelas da Fase 1, com tipagem gerada pelo Supabase. */
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type NewProfile = Database["public"]["Tables"]["profiles"]["Insert"];

export type Store = Database["public"]["Tables"]["stores"]["Row"];
export type NewStore = Database["public"]["Tables"]["stores"]["Insert"];

/**
 * Campos do formulário de loja — usados no onboarding e nas definições.
 * `slug` só entra no onboarding: nas definições a imutabilidade é decisão
 * de produto da Fase 1 (o endereço vira subdomínio público).
 */
export const STORE_FORM_FIELDS = [
  "name",
  "slug",
  "whatsapp_number",
  "phone_country_code",
  "country",
  "language",
  "currency",
  "description",
  "timezone",
  "primary_color",
  "banner_url",
  "opening_hours",
  "instagram_url",
  "facebook_url",
] as const;

export type StoreFormField = (typeof STORE_FORM_FIELDS)[number];

/** Todos os campos são strings no formulário; o domínio converte. */
export type StoreFormValues = Record<StoreFormField, string>;

export type StoreFormState = {
  error: string | null;
  notice: string | null;
  fieldErrors: Partial<Record<StoreFormField, string>>;
  values: StoreFormValues;
};

export function emptyStoreFormValues(): StoreFormValues {
  return {
    name: "",
    slug: "",
    whatsapp_number: "",
    phone_country_code: "",
    country: "",
    language: "",
    currency: "",
    description: "",
    timezone: "",
    primary_color: "",
    banner_url: "",
    opening_hours: "",
    instagram_url: "",
    facebook_url: "",
  };
}

/**
 * Campos SEGUROS para a vitrine pública (cliente ANON).
 * `owner_id` NUNCA faz parte desta lista: o UUID do lojista não é público.
 */
export type PublicStore = Pick<
  Store,
  | "id"
  | "name"
  | "slug"
  | "description"
  | "logo_url"
  | "banner_url"
  | "whatsapp_number"
  | "primary_color"
  | "template"
  | "button_color"
  | "accent_color"
  | "background_color"
  | "product_layout"
  | "image_ratio"
  | "button_style"
  | "card_style"
  | "opening_hours"
  | "instagram_url"
  | "facebook_url"
  | "currency"
  | "language"
  | "is_active"
  | "created_at"
>;
