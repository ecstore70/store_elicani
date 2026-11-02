import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatCurrency } from "../currency.ts";
import { createTranslator } from "../i18n/translate.ts";
import { buildStorefrontStrings } from "./strings.ts";
import { buildOrderMessage } from "./order-message.ts";

/**
 * Testes do construtor da MENSAGEM de pedido do WhatsApp (§8 do plano):
 * estrutura, etiquetas i18n reais, valores com a moeda da loja, blocos
 * opcionais omitidos quando vazios e o suporte futuro de taxas de entrega.
 */

const strings = buildStorefrontStrings(createTranslator("en"));
const money = (value: number) => formatCurrency(value, "MZN", "en");

describe("buildOrderMessage", () => {
  it("monta a mensagem completa com cabeçalho, cliente, produtos, morada, pagamento e observações", () => {
    const message = buildOrderMessage({
      storeName: "Loja Boa",
      lines: [
        {
          name: "Linen Shirt",
          qty: 2,
          unitPrice: 1200,
          options: [
            { groupLabel: "Size", choiceLabel: "Large", priceDelta: 200 },
          ],
        },
        { name: "Cap", qty: 1, unitPrice: 300 },
      ],
      subtotal: 2700,
      deliveryFee: null,
      customer: {
        name: "João",
        phone: "+258 84 123 4567",
        address: "Rua X, Bairro Y",
        neighborhood: "Central",
        reference: "Porta azul",
        notes: "Entregar depois das 18h",
        payment: "Cash on delivery",
      },
      currency: "MZN",
      locale: "en",
      strings,
    });

    assert.equal(
      message,
      [
        "*Loja Boa*",
        `🛒 ${strings.msgNewOrder}`,
        "",
        `${strings.msgCustomer}: João`,
        `${strings.msgPhone}: +258 84 123 4567`,
        "",
        `${strings.msgProducts}:`,
        `2× Linen Shirt — ${money(2400)}`,
        `  • Size: Large (+${money(200)})`,
        `1× Cap — ${money(300)}`,
        "",
        `${strings.subtotal}: ${money(2700)}`,
        "",
        `${strings.msgAddress}:`,
        "Rua X, Bairro Y",
        `${strings.neighborhood}: Central`,
        `${strings.referencePoint}: Porta azul`,
        "",
        `${strings.paymentMethod}: Cash on delivery`,
        "",
        `${strings.orderNotes}: Entregar depois das 18h`,
      ].join("\n"),
    );
  });

  it("omite morada, pagamento e observações quando vazios", () => {
    const message = buildOrderMessage({
      storeName: "Loja Boa",
      lines: [{ name: "Cap", qty: 1, unitPrice: 300 }],
      subtotal: 300,
      customer: { name: "Ana", phone: "841234567" },
      currency: "MZN",
      locale: "en",
      strings,
    });

    assert.ok(!message.includes(`${strings.msgAddress}:`));
    assert.ok(!message.includes(strings.paymentMethod));
    assert.ok(!message.includes(strings.orderNotes));
    assert.ok(message.includes(`${strings.msgCustomer}: Ana`));
    assert.ok(message.includes(`${strings.subtotal}: ${money(300)}`));
  });

  it("sem taxa de entrega não mostra Delivery/TOTAL; com taxa, mostra ambos", () => {
    const base = {
      storeName: "Loja Boa",
      lines: [{ name: "Cap", qty: 1, unitPrice: 300 }],
      subtotal: 300,
      customer: { name: "Ana", phone: "841234567" },
      currency: "MZN",
      locale: "en" as const,
      strings,
    };

    const withoutFee = buildOrderMessage({ ...base, deliveryFee: null });
    assert.ok(!withoutFee.includes(strings.delivery));
    assert.ok(!withoutFee.includes(strings.msgTotal));

    const withFee = buildOrderMessage({ ...base, deliveryFee: 100 });
    assert.ok(withFee.includes(`${strings.delivery}: ${money(100)}`));
    assert.ok(withFee.includes(`${strings.msgTotal}: ${money(400)}`));
  });

  it("o conteúdo do comerciante entra sem escape — nome e valores tal como são", () => {
    const message = buildOrderMessage({
      storeName: "Café & «Irmãos» <b>",
      lines: [{ name: 'Sabor 50% "especial" & Cia', qty: 3, unitPrice: 99.5 }],
      subtotal: 298.5,
      customer: { name: "Zé d'Ávila", phone: "841234567" },
      currency: "MZN",
      locale: "en",
      strings,
    });

    assert.ok(message.includes("*Café & «Irmãos» <b>*"));
    assert.ok(message.includes('3× Sabor 50% "especial" & Cia —'));
    assert.ok(message.includes(`${strings.msgCustomer}: Zé d'Ávila`));
    assert.ok(message.includes(`${strings.subtotal}: ${money(298.5)}`));
  });
});
