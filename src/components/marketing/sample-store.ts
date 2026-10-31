import type { PublicCategory, PublicProduct } from "@/lib/catalog/types";
import type { MessageKey } from "@/lib/i18n/messages/en";

/**
 * Amostra de loja para os visuais de marketing.
 *
 * CAMADA DE CONTEÚDO: nomes de produtos, descrições e categorias aqui são
 * "conteúdo do comerciante" — nunca passam pelo sistema de tradução da UI,
 * exatamente como acontece com dados reais. Apenas os rótulos de sistema
 * (busca, categorias, botões, carrinho) são traduzidos, e vêm das chaves
 * `storefront.*`.
 *
 * Preços/formatos usam as moedas e o `Intl.NumberFormat` existentes.
 */

export const SAMPLE_STORE = {
  name: "Nova Moda",
  description: "Everyday style, delivered simply.",
  currency: "USD",
} as const;

/** Aparência de demonstração — mesmos controles do painel (template market). */
export const SAMPLE_APPEARANCE = {
  template: "market",
  product_layout: "grid",
  image_ratio: "square",
  button_style: "rounded",
  card_style: "subtle",
} as const;

export const SAMPLE_CATEGORIES: PublicCategory[] = [
  { id: "c-apparel", name: "Apparel", sort_order: 0, is_active: true },
  { id: "c-accessories", name: "Accessories", sort_order: 1, is_active: true },
  { id: "c-shoes", name: "Shoes", sort_order: 2, is_active: true },
];

export const SAMPLE_PRODUCTS: PublicProduct[] = [
  {
    id: "p-shirt",
    category_id: "c-apparel",
    name: "Linen Shirt",
    description: "Breathable linen, relaxed fit.",
    price: 49.9,
    promo_price: 39.9,
    image_url: "/demo/shirt.svg",
    is_available: true,
    is_featured: true,
    sort_order: 0,
  },
  {
    id: "p-dress",
    category_id: "c-apparel",
    name: "Summer Dress",
    description: "Light fabric for warm days.",
    price: 64,
    promo_price: null,
    image_url: "/demo/dress.svg",
    is_available: true,
    is_featured: false,
    sort_order: 1,
  },
  {
    id: "p-tote",
    category_id: "c-accessories",
    name: "Classic Tote",
    description: "Canvas tote with inner pocket.",
    price: 29.5,
    promo_price: null,
    image_url: "/demo/tote.svg",
    is_available: true,
    is_featured: false,
    sort_order: 2,
  },
  {
    id: "p-sneakers",
    category_id: "c-shoes",
    name: "Runner Sneakers",
    description: "Cushioned sole, everyday comfort.",
    price: 79,
    promo_price: null,
    image_url: "/demo/sneakers.svg",
    is_available: true,
    is_featured: false,
    sort_order: 3,
  },
  {
    id: "p-cap",
    category_id: "c-accessories",
    name: "Cotton Cap",
    description: "Adjustable, one size.",
    price: 18,
    promo_price: 14.5,
    image_url: "/demo/cap.svg",
    is_available: true,
    is_featured: false,
    sort_order: 4,
  },
  {
    id: "p-wallet",
    category_id: "c-accessories",
    name: "Leather Wallet",
    description: "Slim profile, six card slots.",
    price: 34,
    promo_price: null,
    image_url: "/demo/wallet.svg",
    is_available: true,
    is_featured: false,
    sort_order: 5,
  },
];

/** 4 produtos para o enquadramento compacto do hero. */
export const SAMPLE_HERO_PRODUCT_IDS = [
  "p-shirt",
  "p-dress",
  "p-tote",
  "p-sneakers",
] as const;

export const SAMPLE_HERO_PRODUCTS = SAMPLE_PRODUCTS.filter((product) =>
  (SAMPLE_HERO_PRODUCT_IDS as readonly string[]).includes(product.id),
);

/** Subtotal demonstrado na barra de carrinho do mock de telemóvel. */
export const SAMPLE_CART_COUNT: number = 2;
export const SAMPLE_CART_SUBTOTAL: number = 69.4; // 39.90 (camisa em promoção) + 29.50 (tote)

/** Encomendas do mock do painel — IDs e valores genéricos, sem dados pessoais. */
export const SAMPLE_ORDERS: readonly {
  id: string;
  items: number;
  total: number;
  status: MessageKey;
}[] = [
  { id: "#1024", items: 3, total: 84.5, status: "landing.statusNew" },
  { id: "#1023", items: 2, total: 79.4, status: "landing.statusConfirmed" },
  { id: "#1022", items: 4, total: 156, status: "landing.statusDelivered" },
];
