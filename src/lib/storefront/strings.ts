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
  poweredBy: string;
  openCartAria: string;
  cartCountAria: string;
  productImageAlt: string;
  noImageAlt: string;
  // ── página de produto ───────────────────────────────────────────────
  backToStore: string;
  productDescription: string;
  relatedProducts: string;
  whatsappContact: string;
  optionsRequired: string;
  // ── checkout (sheet) ───────────────────────────────────────────────
  checkout: string;
  continueShopping: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  neighborhood: string;
  referencePoint: string;
  orderNotes: string;
  paymentMethod: string;
  paymentCash: string;
  paymentTransfer: string;
  paymentOther: string;
  nameRequired: string;
  phoneRequired: string;
  neighborhoodRequired: string;
  checkoutRequired: string;
  checkoutNote: string;
  orderSent: string;
  // ── carrinho e checkout (apresentação) ───────────────────────────────
  orderSummary: string;
  total: string;
  addedToCart: string;
  cartItemsOne: string;
  cartItemsMany: string;
  exploreProducts: string;
  yourOrder: string;
  customerDetails: string;
  close: string;
  // ── galeria de mídia do produto ─────────────────────────────────────
  galleryLabel: string;
  galleryVideo: string;
  galleryPrevious: string;
  galleryNext: string;
  galleryUnavailable: string;
  galleryPlay: string;
  // ── vídeo do conteúdo (bloco da página de produto) ───────────────────
  videoSoundOn: string;
  videoSoundOff: string;
  // ── rótulos da mensagem de pedido (WhatsApp) ────────────────────────
  msgNewOrder: string;
  msgCustomer: string;
  msgPhone: string;
  msgProducts: string;
  msgTotal: string;
  msgAddress: string;
  // ── guarda de envio de pedido: catálogo inativo ───────────────────────
  catalogUnavailable: string;
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
    poweredBy: t("storefront.poweredBy"),
    openCartAria: t("storefront.openCartAria"),
    cartCountAria: t("storefront.cartCountAria"),
    productImageAlt: t("storefront.productImageAlt"),
    noImageAlt: t("storefront.noImageAlt"),
    backToStore: t("storefront.backToStore"),
    productDescription: t("storefront.productDescription"),
    relatedProducts: t("storefront.relatedProducts"),
    whatsappContact: t("storefront.whatsappContact"),
    optionsRequired: t("storefront.optionsRequired"),
    checkout: t("storefront.checkout"),
    continueShopping: t("storefront.continueShopping"),
    customerName: t("storefront.customerName"),
    customerPhone: t("storefront.customerPhone"),
    deliveryAddress: t("storefront.deliveryAddress"),
    neighborhood: t("storefront.neighborhood"),
    referencePoint: t("storefront.referencePoint"),
    orderNotes: t("storefront.orderNotes"),
    paymentMethod: t("storefront.paymentMethod"),
    paymentCash: t("storefront.paymentCash"),
    paymentTransfer: t("storefront.paymentTransfer"),
    paymentOther: t("storefront.paymentOther"),
    nameRequired: t("storefront.nameRequired"),
    phoneRequired: t("storefront.phoneRequired"),
    neighborhoodRequired: t("storefront.neighborhoodRequired"),
    checkoutRequired: t("storefront.checkoutRequired"),
    checkoutNote: t("storefront.checkoutNote"),
    orderSent: t("storefront.orderSent"),
    orderSummary: t("storefront.orderSummary"),
    total: t("storefront.total"),
    addedToCart: t("storefront.addedToCart"),
    cartItemsOne: t("storefront.cartItemsOne"),
    cartItemsMany: t("storefront.cartItemsMany"),
    exploreProducts: t("storefront.exploreProducts"),
    yourOrder: t("storefront.yourOrder"),
    customerDetails: t("storefront.customerDetails"),
    close: t("storefront.close"),
    galleryLabel: t("storefront.galleryLabel"),
    galleryVideo: t("storefront.galleryVideo"),
    galleryPrevious: t("storefront.galleryPrevious"),
    galleryNext: t("storefront.galleryNext"),
    galleryUnavailable: t("storefront.galleryUnavailable"),
    galleryPlay: t("storefront.galleryPlay"),
    videoSoundOn: t("storefront.videoSoundOn"),
    videoSoundOff: t("storefront.videoSoundOff"),
    msgNewOrder: t("storefront.msgNewOrder"),
    msgCustomer: t("storefront.msgCustomer"),
    msgPhone: t("storefront.msgPhone"),
    msgProducts: t("storefront.msgProducts"),
    msgTotal: t("storefront.msgTotal"),
    msgAddress: t("storefront.msgAddress"),
    catalogUnavailable: t("storefront.catalogUnavailable"),
  };
}
