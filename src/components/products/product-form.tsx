"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
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
import {
  createProductAction,
  updateProductAction,
} from "@/lib/catalog/actions";
import {
  emptyProductFormValues,
  type ProductFormState,
  type ProductFormValues,
} from "@/lib/catalog/types";
import type { Locale } from "@/lib/i18n/config";
import { createTranslator } from "@/lib/i18n/translate";

const INITIAL_STATE: ProductFormState = {
  error: null,
  notice: null,
  fieldErrors: {},
  values: emptyProductFormValues(),
};

/**
 * Formulário de produto (criação e edição — o mesmo componente).
 * Validação no cliente E no servidor; o servidor é sempre a autoridade.
 */
export function ProductForm({
  locale,
  productId,
  initialValues,
  categories,
}: {
  locale: Locale;
  /** Presente = edição; ausente = criação. */
  productId?: string;
  initialValues?: Partial<ProductFormValues>;
  categories: { id: string; name: string }[];
}) {
  const t = createTranslator(locale);
  const action = productId
    ? updateProductAction.bind(null, productId)
    : createProductAction;
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);

  const [values, setValues] = useState<ProductFormValues>(() => ({
    ...emptyProductFormValues(),
    ...initialValues,
  }));

  function update<K extends keyof ProductFormValues>(
    key: K,
    value: ProductFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  const imagePreview = values.image_url.trim();

  return (
    <form action={formAction} className="space-y-8" noValidate>
      {state.error && <FormAlert tone="error">{state.error}</FormAlert>}
      {state.notice && <FormAlert tone="success">{state.notice}</FormAlert>}

      <FormSection title={t("products.sectionDetails")}>
        <TextField
          className="sm:col-span-2"
          label={t("products.name")}
          name="name"
          value={values.name}
          onChange={(event) => update("name", event.target.value)}
          placeholder={t("products.namePlaceholder")}
          error={state.fieldErrors.name}
          required
        />

        <TextAreaField
          className="sm:col-span-2"
          label={t("products.description")}
          name="description"
          value={values.description}
          onChange={(event) => update("description", event.target.value)}
          placeholder={t("products.descriptionPlaceholder")}
          maxLength={1000}
          error={state.fieldErrors.description}
        />
      </FormSection>

      <FormSection title={t("products.sectionPricing")}>
        <TextField
          label={t("products.price")}
          name="price"
          value={values.price}
          onChange={(event) => update("price", event.target.value)}
          placeholder="1000.00"
          inputMode="decimal"
          error={state.fieldErrors.price}
          required
        />

        <TextField
          label={t("products.promoPrice")}
          name="promo_price"
          value={values.promo_price}
          onChange={(event) => update("promo_price", event.target.value)}
          placeholder="800.00"
          hint={t("products.promoPriceHint")}
          inputMode="decimal"
          error={state.fieldErrors.promo_price}
        />
      </FormSection>

      <FormSection title={t("products.sectionOrganization")}>
        <SelectField
          label={t("products.category")}
          name="category_id"
          value={values.category_id}
          onChange={(event) => update("category_id", event.target.value)}
          options={categories.map((category) => ({
            value: category.id,
            label: category.name,
          }))}
          placeholder={t("products.noCategory")}
          error={state.fieldErrors.category_id}
        />

        <TextField
          label={t("products.image")}
          name="image_url"
          value={values.image_url}
          onChange={(event) => update("image_url", event.target.value)}
          placeholder="https://…"
          hint={t("products.imageHint")}
          inputMode="url"
          autoCapitalize="none"
          spellCheck={false}
          error={state.fieldErrors.image_url}
        />

        {imagePreview && (
          <div className="space-y-1.5 sm:col-span-2">
            <Label>{t("products.imagePreview")}</Label>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imagePreview}
              alt={t("products.imagePreview")}
              className="size-24 rounded-lg border border-border/70 object-cover"
            />
          </div>
        )}

        <div className="space-y-3 sm:col-span-2">
          <label className="flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              name="is_available"
              checked={values.is_available === "true"}
              onChange={(event) =>
                update("is_available", event.target.checked ? "true" : "")
              }
              className="size-4 rounded border-input accent-primary"
            />
            <span className="text-sm font-medium">{t("products.available")}</span>
          </label>

          <label className="flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              name="is_featured"
              checked={values.is_featured === "true"}
              onChange={(event) =>
                update("is_featured", event.target.checked ? "true" : "")
              }
              className="size-4 rounded border-input accent-primary"
            />
            <span className="text-sm font-medium">{t("products.featured")}</span>
          </label>
          <p className="text-xs text-muted-foreground">
            {t("products.featuredHint")}
          </p>
        </div>
      </FormSection>

      <div className="flex items-center justify-between gap-3 border-t border-border/70 pt-6">
        <Button type="button" variant="outline" asChild>
          <Link href="/app/products">{t("common.cancel")}</Link>
        </Button>
        <Button type="submit" size="lg" disabled={pending}>
          {pending && (
            <Loader2 aria-hidden="true" data-icon="inline-start" className="animate-spin" />
          )}
          {productId ? t("products.save") : t("products.create")}
        </Button>
      </div>
    </form>
  );
}
