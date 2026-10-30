"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getTranslator } from "@/lib/i18n/locale";
import type { Translator } from "@/lib/i18n/translate";
import { createClient } from "@/lib/supabase/server";
import { requireStore } from "@/lib/stores/queries";
import { validateProductValues } from "./validate";
import {
  emptyProductFormValues,
  type CategoryFormState,
  type ProductFormField,
  type ProductFormState,
  type ProductFormValues,
} from "./types";

// ── validação ─────────────────────────────────────────────────────────────
const CATEGORY_NAME_MAX_LENGTH = 60;
const NAME_MIN_LENGTH = 1;

function readProductValues(formData: FormData): ProductFormValues {
  const read = (field: ProductFormField): string =>
    String(formData.get(field) ?? "").trim();

  return {
    ...emptyProductFormValues(),
    name: read("name"),
    description: read("description"),
    price: read("price"),
    promo_price: read("promo_price"),
    category_id: read("category_id"),
    image_url: read("image_url"),
    // Checkbox: ausente = false, presente = "true".
    is_available: formData.get("is_available") ? "true" : "",
    is_featured: formData.get("is_featured") ? "true" : "",
  };
}

function toProductPayload(values: ProductFormValues) {
  return {
    name: values.name.trim(),
    description: values.description.trim() || null,
    price: Number(values.price),
    promo_price: values.promo_price.trim() ? Number(values.promo_price) : null,
    category_id: values.category_id.trim() || null,
    image_url: values.image_url.trim() || null,
    is_available: values.is_available === "true",
    is_featured: values.is_featured === "true",
  };
}

/** Erro de banco → mensagem de usuário. Nunca expõe SQL/constraints. */
function mapCatalogError(
  code: string | undefined,
  message: string | undefined,
  t: Translator,
  mode: "create" | "update",
): string {
  if (code === "42501" || code === "23503" || code === "PGRST116") {
    return t("store.error.sessionInvalid");
  }
  if (mode === "create") return t("products.error.createFailed");
  return t("products.error.saveFailed");
}

function productValuesFrom(
  values: ProductFormValues,
  patch: Partial<Pick<ProductFormState, "error" | "notice" | "fieldErrors">>,
): ProductFormState {
  return { error: null, notice: null, fieldErrors: {}, values, ...patch };
}

/** Revalida as rotas do catálogo (lista + vitrine pública é dinâmica). */
function revalidateCatalog(storeSlug: string) {
  revalidatePath("/app/products");
  revalidatePath("/app/categories");
  revalidatePath("/app", "layout");
  revalidatePath(`/store/${storeSlug}`);
  revalidatePath("/", "layout");
}

// ── produtos ──────────────────────────────────────────────────────────────
export async function createProductAction(
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const user = await requireUser();
  const t = await getTranslator();
  const store = await requireStore(user.id);
  const values = readProductValues(formData);

  const fieldErrors = validateProductValues(values, t);
  if (Object.keys(fieldErrors).length > 0) {
    return productValuesFrom(values, { fieldErrors });
  }

  // Só categorias DA PRÓPRIA loja são aceitas (o RLS reforça no banco).
  const categoryId = values.category_id.trim();
  if (categoryId) {
    const supabaseCheck = await createClient();
    const { data: category } = await supabaseCheck
      .from("categories")
      .select("id")
      .eq("store_id", store.id)
      .eq("id", categoryId)
      .maybeSingle();
    if (!category) {
      return productValuesFrom(values, {
        fieldErrors: { category_id: t("products.error.categoryInvalid") },
      });
    }
  }

  const supabase = await createClient();
  const { error } = await supabase.from("products").insert({
    store_id: store.id,
    ...toProductPayload(values),
  });

  if (error) {
    return productValuesFrom(values, {
      error: mapCatalogError(error.code, error.message, t, "create"),
    });
  }

  revalidateCatalog(store.slug);
  redirect("/app/products");
}

export async function updateProductAction(
  productId: string,
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const user = await requireUser();
  const t = await getTranslator();
  const store = await requireStore(user.id);
  const values = readProductValues(formData);

  const fieldErrors = validateProductValues(values, t);
  if (Object.keys(fieldErrors).length > 0) {
    return productValuesFrom(values, { fieldErrors });
  }

  const categoryId = values.category_id.trim();
  if (categoryId) {
    const supabaseCheck = await createClient();
    const { data: category } = await supabaseCheck
      .from("categories")
      .select("id")
      .eq("store_id", store.id)
      .eq("id", categoryId)
      .maybeSingle();
    if (!category) {
      return productValuesFrom(values, {
        fieldErrors: { category_id: t("products.error.categoryInvalid") },
      });
    }
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .update(toProductPayload(values))
    .eq("store_id", store.id)
    .eq("id", productId)
    .select("id")
    .maybeSingle();

  if (error) {
    return productValuesFrom(values, {
      error: mapCatalogError(error.code, error.message, t, "update"),
    });
  }
  if (!data) {
    return productValuesFrom(values, { error: t("products.error.saveFailed") });
  }

  revalidateCatalog(store.slug);
  return productValuesFrom(values, { notice: t("products.saved") });
}

/** Apaga um produto da própria loja (idempotente para a UI). */
export async function deleteProductAction(productId: string): Promise<void> {
  const user = await requireUser();
  const store = await requireStore(user.id);

  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("store_id", store.id)
    .eq("id", productId);

  if (error) {
    throw new Error(`Failed to delete product: ${error.message}`);
  }

  revalidateCatalog(store.slug);
}

/** Liga/desliga destaque ou disponibilidade de um produto próprio. */
export async function setProductFlagAction(
  productId: string,
  field: "is_featured" | "is_available",
  value: boolean,
): Promise<void> {
  const user = await requireUser();
  const store = await requireStore(user.id);

  const patch =
    field === "is_featured"
      ? { is_featured: value }
      : { is_available: value };

  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update(patch)
    .eq("store_id", store.id)
    .eq("id", productId);

  if (error) {
    throw new Error(`Failed to update product: ${error.message}`);
  }

  revalidateCatalog(store.slug);
}

/**
 * Move um produto uma posição na ordenação do comerciante.
 * Mecanismo simples (↑/↓), persistido em `sort_order` — nada de drag-and-drop.
 */
export async function moveProductAction(
  productId: string,
  direction: "up" | "down",
): Promise<void> {
  const user = await requireUser();
  const store = await requireStore(user.id);

  const supabase = await createClient();
  const { data: products, error } = await supabase
    .from("products")
    .select("id, sort_order, created_at")
    .eq("store_id", store.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error || !products) {
    throw new Error(`Failed to load products: ${error?.message}`);
  }

  const index = products.findIndex((product) => product.id === productId);
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || targetIndex < 0 || targetIndex >= products.length) return;

  const current = products[index];
  const target = products[targetIndex];

  const first = await supabase
    .from("products")
    .update({ sort_order: target.sort_order })
    .eq("store_id", store.id)
    .eq("id", current.id);

  if (first.error) {
    throw new Error(`Failed to reorder products: ${first.error.message}`);
  }

  const second = await supabase
    .from("products")
    .update({ sort_order: current.sort_order })
    .eq("store_id", store.id)
    .eq("id", target.id);

  if (second.error) {
    throw new Error(`Failed to reorder products: ${second.error.message}`);
  }

  revalidateCatalog(store.slug);
}

// ── categorias ────────────────────────────────────────────────────────────
function categoryState(
  values: { name: string },
  patch: Partial<Pick<CategoryFormState, "error" | "notice" | "fieldErrors">>,
): CategoryFormState {
  return { error: null, notice: null, fieldErrors: {}, values, ...patch };
}

function readCategoryName(formData: FormData): string {
  return String(formData.get("name") ?? "").trim();
}

function validateCategoryName(
  name: string,
  t: Translator,
): string | null {
  if (name.length < NAME_MIN_LENGTH) return t("categories.error.nameRequired");
  if (name.length > CATEGORY_NAME_MAX_LENGTH) {
    return t("categories.error.nameTooLong");
  }
  return null;
}

export async function createCategoryAction(
  _prevState: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const user = await requireUser();
  const t = await getTranslator();
  const store = await requireStore(user.id);
  const name = readCategoryName(formData);

  const nameError = validateCategoryName(name, t);
  if (nameError) {
    return categoryState({ name }, { fieldErrors: { name: nameError } });
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .insert({ store_id: store.id, name });

  if (error) {
    return categoryState(
      { name },
      { error: t("categories.error.createFailed") },
    );
  }

  revalidateCatalog(store.slug);
  return categoryState({ name: "" }, { notice: t("categories.created") });
}

export async function updateCategoryAction(
  categoryId: string,
  _prevState: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const user = await requireUser();
  const t = await getTranslator();
  const store = await requireStore(user.id);
  const name = readCategoryName(formData);

  const nameError = validateCategoryName(name, t);
  if (nameError) {
    return categoryState({ name }, { fieldErrors: { name: nameError } });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .update({ name })
    .eq("store_id", store.id)
    .eq("id", categoryId)
    .select("id")
    .maybeSingle();

  if (error) {
    return categoryState({ name }, { error: t("categories.error.saveFailed") });
  }
  if (!data) {
    return categoryState({ name }, { error: t("categories.error.saveFailed") });
  }

  revalidateCatalog(store.slug);
  return categoryState({ name }, { notice: t("categories.saved") });
}

/** Ativa/desativa categoria (inativas somem da vitrine). */
export async function setCategoryActiveAction(
  categoryId: string,
  active: boolean,
): Promise<void> {
  const user = await requireUser();
  const store = await requireStore(user.id);

  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .update({ is_active: active })
    .eq("store_id", store.id)
    .eq("id", categoryId);

  if (error) {
    throw new Error(`Failed to update category: ${error.message}`);
  }

  revalidateCatalog(store.slug);
}

/**
 * Apaga a categoria. Produtos NÃO são apagados: o banco faz
 * `on delete set null` — eles continuam no catálogo, sem categoria.
 */
export async function deleteCategoryAction(categoryId: string): Promise<void> {
  const user = await requireUser();
  const store = await requireStore(user.id);

  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("store_id", store.id)
    .eq("id", categoryId);

  if (error) {
    throw new Error(`Failed to delete category: ${error.message}`);
  }

  revalidateCatalog(store.slug);
}

/** Move uma categoria uma posição (mecanismo simples ↑/↓). */
export async function moveCategoryAction(
  categoryId: string,
  direction: "up" | "down",
): Promise<void> {
  const user = await requireUser();
  const store = await requireStore(user.id);

  const supabase = await createClient();
  const { data: categories, error } = await supabase
    .from("categories")
    .select("id, sort_order, created_at")
    .eq("store_id", store.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error || !categories) {
    throw new Error(`Failed to load categories: ${error?.message}`);
  }

  const index = categories.findIndex((category) => category.id === categoryId);
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || targetIndex < 0 || targetIndex >= categories.length) return;

  const current = categories[index];
  const target = categories[targetIndex];

  const first = await supabase
    .from("categories")
    .update({ sort_order: target.sort_order })
    .eq("store_id", store.id)
    .eq("id", current.id);

  if (first.error) {
    throw new Error(`Failed to reorder categories: ${first.error.message}`);
  }

  const second = await supabase
    .from("categories")
    .update({ sort_order: current.sort_order })
    .eq("store_id", store.id)
    .eq("id", target.id);

  if (second.error) {
    throw new Error(`Failed to reorder categories: ${second.error.message}`);
  }

  revalidateCatalog(store.slug);
}
