import type { Translator } from "@/lib/i18n/translate";

/**
 * Strings da vitrine — construídas no servidor com o tradutor do idioma
 * DEFINIDO PELA LOJA e passadas aos componentes cliente como dados
 * serializáveis. Conteúdo do comerciante (nome, produtos) NUNCA é
 * traduzido automaticamente.
 */
export type StorefrontStrings = {
  searchPlaceholder: string;
  categories: string;
  allProducts: string;
  featured: string;
  addToCart: string;
  unavailable: string;
  noProducts: string;
  noProductsBody: string;
  noResults: string;
  noResultsBody: string;
  cart: string;
  cartEmpty: string;
  cartEmptyBody: string;
  orderWhatsApp: string;
  subtotal: string;
  increaseQty: string;
  decreaseQty: string;
  removeItem: string;
  itemQuantity: string;
  storeInfo: string;
  delivery: string;
  deliveryBody: string;
  contact: string;
  openingHours: string;
  followUs: string;
  openCartAria: string;
  cartCountAria: string;
  productImageAlt: string;
  noImageAlt: string;
};

export function buildStorefrontStrings(t: Translator): StorefrontStrings {
  return {
    searchPlaceholder: t("storefront.searchPlaceholder"),
    categories: t("storefront.categories"),
    allProducts: t("storefront.allProducts"),
    featured: t("storefront.featured"),
    addToCart: t("storefront.addToCart"),
    unavailable: t("storefront.unavailable"),
    noProducts: t("storefront.noProducts"),
    noProductsBody: t("storefront.noProductsBody"),
    noResults: t("storefront.noResults"),
    noResultsBody: t("storefront.noResultsBody"),
    cart: t("storefront.cart"),
    cartEmpty: t("storefront.cartEmpty"),
    cartEmptyBody: t("storefront.cartEmptyBody"),
    orderWhatsApp: t("storefront.orderWhatsApp"),
    subtotal: t("storefront.subtotal"),
    increaseQty: t("storefront.increaseQty"),
    decreaseQty: t("storefront.decreaseQty"),
    removeItem: t("storefront.removeItem"),
    itemQuantity: t("storefront.itemQuantity"),
    storeInfo: t("storefront.storeInfo"),
    delivery: t("storefront.delivery"),
    deliveryBody: t("storefront.deliveryBody"),
    contact: t("storefront.contact"),
    openingHours: t("storefront.openingHours"),
    followUs: t("storefront.followUs"),
    openCartAria: t("storefront.openCartAria"),
    cartCountAria: t("storefront.cartCountAria"),
    productImageAlt: t("storefront.productImageAlt"),
    noImageAlt: t("storefront.noImageAlt"),
  };
}
