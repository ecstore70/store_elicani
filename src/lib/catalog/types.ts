import type { Database } from "@/lib/database.types";
import type { AppearanceValues } from "@/lib/stores/appearance";

/** Linhas das tabelas de catálogo, tipadas pelo Supabase. */
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type NewCategory = Database["public"]["Tables"]["categories"]["Insert"];

export type Product = Database["public"]["Tables"]["products"]["Row"];
export type NewProduct = Database["public"]["Tables"]["products"]["Insert"];

/** Linha bruta de `product_media`, gerada pelo Supabase (fonte única). */
export type ProductMedia =
  Database["public"]["Tables"]["product_media"]["Row"];

/**
 * Campos SEGUROS para a vitrine pública. Nada de store_id aqui: a vitrine
 * já resolveu a loja — o visitante não precisa de internos de tenant.
 */
export type PublicProduct = Pick<
  Product,
  | "id"
  | "category_id"
  | "name"
  | "description"
  | "price"
  | "promo_price"
  | "image_url"
  | "is_available"
  | "is_featured"
  | "sort_order"
>;

export type PublicCategory = Pick<
  Category,
  "id" | "name" | "sort_order" | "is_active"
>;

/** Item da galeria exposto à vitrine — sem id nem tenant (só tipo + URL). */
export type PublicMediaItem = { type: "image" | "video"; url: string };

/** Catálogo público de uma loja — o que a vitrine renderiza. */
export type StoreCatalog = {
  products: PublicProduct[];
  categories: PublicCategory[];
};

// ── formulário de produto ─────────────────────────────────────────────────
export const PRODUCT_FORM_FIELDS = [
  "name",
  "description",
  "price",
  "promo_price",
  "category_id",
  "image_url",
  "is_available",
  "is_featured",
] as const;

export type ProductFormField = (typeof PRODUCT_FORM_FIELDS)[number];

/** Todos os campos chegam como string do formulário; o domínio converte. */
export type ProductFormValues = Record<ProductFormField, string>;

export type ProductFormState = {
  error: string | null;
  notice: string | null;
  fieldErrors: Partial<Record<ProductFormField, string>>;
  values: ProductFormValues;
};

export function emptyProductFormValues(): ProductFormValues {
  return {
    name: "",
    description: "",
    price: "",
    promo_price: "",
    category_id: "",
    image_url: "",
    is_available: "true",
    is_featured: "",
  };
}

// ── formulário de categoria ───────────────────────────────────────────────
export type CategoryFormValues = { name: string };

export type CategoryFormState = {
  error: string | null;
  notice: string | null;
  fieldErrors: Partial<Record<"name", string>>;
  values: CategoryFormValues;
};

// ── estado do formulário de aparência ─────────────────────────────────────
export type AppearanceFormState = {
  error: string | null;
  notice: string | null;
};

/** Preview realista: até N produtos reais do comerciante. */
export type StorefrontPreviewData = {
  storeName: string;
  logoUrl: string | null;
  currency: string;
  appearance: AppearanceValues;
  products: PublicProduct[];
  categories: PublicCategory[];
};
