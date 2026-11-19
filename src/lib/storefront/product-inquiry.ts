// Import relativo (com extensão .ts): este módulo é PURO e também corre nos
// testes de `node --test`, que não resolvem o alias "@" do Next.
import { formatCurrency } from "../currency.ts";
import type { Locale } from "@/lib/i18n/config";

/**
 * Mensagem de interesse em UM produto — o formato ÚNICO da vitrine,
 * usado pelo painel de compra da página de produto E pelo CTA
 * flutuante (uma só geração de mensagem, nunca duas):
 *
 *   *Nome da loja*
 *   Nome do produto — Preço formatado
 *   URL canónica do produto
 *
 * O nome do comerciante e o conteúdo do produto entram tal como estão
 * (nunca traduzidos); o preço é formatado pelo `Intl` existente com a
 * moeda e o locale da loja/visitante.
 */
export function buildProductInquiryMessage(input: {
  storeName: string;
  productName: string;
  /** Preço ATUAL exibido na página (promoção quando existe). */
  price: number;
  currency: string;
  locale: Locale;
  productUrl: string;
}): string {
  const { storeName, productName, price, currency, locale, productUrl } = input;
  return `*${storeName}*\n${productName} — ${formatCurrency(price, currency, locale)}\n${productUrl}`;
}

/**
 * `wa.me` base com a mensagem anexada (`?text=` URL-encoded) — o mesmo
 * href das duas ações de produto da vitrine (painel de compra e CTA
 * flutuante), para o WhatsApp abrir com o texto pronto.
 */
export function productInquiryHref(baseHref: string, message: string): string {
  return `${baseHref}?text=${encodeURIComponent(message)}`;
}
