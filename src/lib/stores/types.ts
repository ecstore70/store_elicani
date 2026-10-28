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
  };
}

/**
 * Colunas seguras para o storefront público.
 * `owner_id` NÃO faz parte desta lista: o UUID do lojista nunca é público.
 */
export type PublicStore = Pick<
  Store,
  | "id"
  | "name"
  | "slug"
  | "description"
  | "logo_url"
  | "whatsapp_number"
  | "primary_color"
  | "currency"
  | "language"
  | "is_active"
  | "created_at"
>;
