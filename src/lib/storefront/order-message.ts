// Import relativo (com extensão .ts): este módulo é PURO e também corre nos
// testes de `node --test`, que não resolvem o alias "@" do Next.
import { formatCurrency } from "../currency.ts";
import type { Locale } from "@/lib/i18n/config";
import type { StorefrontStrings } from "./strings";
import type { SelectedOption } from "./product-options";

/**
 * Construtor da MENSAGEM de pedido do WhatsApp — puro e testável.
 *
 * Formato estruturado (loja, cliente, produtos com opções, subtotal,
 * morada, pagamento, observações). As etiquetas vêm das strings i18n da
 * vitrine (o nome da marca "WhatsApp" nunca é traduzido); o conteúdo do
 * comerciante (produtos, valores) entra tal como está, com a moeda
 * formatada pelo `Intl` existente.
 *
 * `deliveryFee` fica preparado para o futuro cálculo de entrega (zonas/
 * taxas): quando não existe, as linhas "Delivery" e "TOTAL" são omitidas.
 */

export type OrderCustomer = {
  name: string;
  phone: string;
  address?: string;
  neighborhood?: string;
  reference?: string;
  notes?: string;
  payment?: string;
};

export type OrderLine = {
  name: string;
  qty: number;
  /** Preço UNITÁRIO já com o acréscimo das opções escolhidas. */
  unitPrice: number;
  options?: readonly SelectedOption[];
};

type MessageStrings = Pick<
  StorefrontStrings,
  | "msgNewOrder"
  | "msgCustomer"
  | "msgPhone"
  | "msgProducts"
  | "subtotal"
  | "delivery"
  | "msgTotal"
  | "msgAddress"
  | "neighborhood"
  | "referencePoint"
  | "paymentMethod"
  | "orderNotes"
>;

export function buildOrderMessage(input: {
  storeName: string;
  lines: readonly OrderLine[];
  subtotal: number;
  customer: OrderCustomer;
  deliveryFee?: number | null;
  currency: string;
  locale: Locale;
  strings: MessageStrings;
}): string {
  const { storeName, lines, subtotal, customer, strings, currency, locale } =
    input;
  const money = (value: number) => formatCurrency(value, currency, locale);

  const blocks: string[] = [];

  // Cabeçalho: loja + tipo de documento.
  blocks.push(`*${storeName}*\n🛒 ${strings.msgNewOrder}`);

  // Cliente.
  const customerLines = [
    `${strings.msgCustomer}: ${customer.name}`,
    `${strings.msgPhone}: ${customer.phone}`,
  ];
  blocks.push(customerLines.join("\n"));

  // Produtos (+ opções escolhidas).
  const productLines = lines.map((line) => {
    const head = `${line.qty}× ${line.name} — ${money(line.unitPrice * line.qty)}`;
    const optionLines = (line.options ?? []).map((option) => {
      const delta =
        option.priceDelta === 0
          ? ""
          : ` (${option.priceDelta > 0 ? "+" : "-"}${money(Math.abs(option.priceDelta))})`;
      return `  • ${option.groupLabel}: ${option.choiceLabel}${delta}`;
    });
    return [head, ...optionLines].join("\n");
  });
  blocks.push(`${strings.msgProducts}:\n${productLines.join("\n")}`);

  // Totais — "Delivery"/"TOTAL" só quando existir taxa (futuro).
  const totalLines = [`${strings.subtotal}: ${money(subtotal)}`];
  if (input.deliveryFee != null) {
    totalLines.push(`${strings.delivery}: ${money(input.deliveryFee)}`);
    totalLines.push(
      `${strings.msgTotal}: ${money(subtotal + input.deliveryFee)}`,
    );
  }
  blocks.push(totalLines.join("\n"));

  // Morada (opcional).
  const addressLines = [
    customer.address,
    customer.neighborhood
      ? `${strings.neighborhood}: ${customer.neighborhood}`
      : null,
    customer.reference
      ? `${strings.referencePoint}: ${customer.reference}`
      : null,
  ].filter((line): line is string => Boolean(line && line.trim()));
  if (addressLines.length > 0) {
    blocks.push(`${strings.msgAddress}:\n${addressLines.join("\n")}`);
  }

  // Pagamento (opcional).
  if (customer.payment) {
    blocks.push(`${strings.paymentMethod}: ${customer.payment}`);
  }

  // Observações (opcional).
  if (customer.notes?.trim()) {
    blocks.push(`${strings.orderNotes}: ${customer.notes.trim()}`);
  }

  return blocks.join("\n\n");
}
