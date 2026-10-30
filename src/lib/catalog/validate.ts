import type { Translator } from "@/lib/i18n/translate.ts";
import type { ProductFormField, ProductFormValues } from "./types.ts";

/**
 * Validação de produto — PURO (sem servidor nem cliente), testável com
 * `node --test` e usado pela action no servidor.
 */

export const PRODUCT_NAME_MIN_LENGTH = 1;
export const PRODUCT_NAME_MAX_LENGTH = 120;
export const DESCRIPTION_MAX_LENGTH = 1000;
export const IMAGE_URL_MAX_LENGTH = 2048;
export const PRICE_PATTERN = /^\d{1,10}(\.\d{1,2})?$/;

export type ProductFieldErrors = Partial<Record<ProductFormField, string>>;

export function validateProductValues(
  values: ProductFormValues,
  t: Translator,
): ProductFieldErrors {
  const errors: ProductFieldErrors = {};

  const name = values.name.trim();
  if (name.length < PRODUCT_NAME_MIN_LENGTH) {
    errors.name = t("products.error.nameRequired");
  } else if (name.length > PRODUCT_NAME_MAX_LENGTH) {
    errors.name = t("products.error.nameTooLong");
  }

  if (values.description.trim().length > DESCRIPTION_MAX_LENGTH) {
    errors.description = t("products.error.descriptionTooLong");
  }

  const price = values.price.trim();
  if (!PRICE_PATTERN.test(price)) {
    errors.price = t("products.error.priceInvalid");
  }

  const promo = values.promo_price.trim();
  if (promo && !PRICE_PATTERN.test(promo)) {
    errors.promo_price = t("products.error.promoPriceInvalid");
  } else if (promo && price && Number(promo) >= Number(price)) {
    errors.promo_price = t("products.error.promoPriceNotBelow");
  }

  const image = values.image_url.trim();
  if (
    image &&
    (image.length > IMAGE_URL_MAX_LENGTH || !/^(https?:\/\/|\/)/i.test(image))
  ) {
    errors.image_url = t("products.error.imageInvalid");
  }

  return errors;
}
