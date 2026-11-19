import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatCurrency } from "../currency.ts";
import {
  buildProductInquiryMessage,
  productInquiryHref,
} from "./product-inquiry.ts";

/**
 * Testes do construtor COMPARTILHADO da mensagem de interesse em UM
 * produto (painel de compra + CTA flutuante): formato único da
 * vitrine, preço vigente formatado pelo `Intl` e href `wa.me?text=`
 * codificado — uma geração de mensagem só, nunca duas.
 */

const URL = "https://shop.elicani.site/store/shop/products/bolsa-anti-robo";

describe("buildProductInquiryMessage", () => {
  it("formato único: *loja* / produto — preço / URL canónica", () => {
    const message = buildProductInquiryMessage({
      storeName: "Elicani Shop",
      productName: "BOLSA ANTI ROUBO À PROVA DA ÁGUA",
      price: 900,
      currency: "MZN",
      locale: "pt-BR",
      productUrl: URL,
    });
    assert.equal(
      message,
      `*Elicani Shop*\nBOLSA ANTI ROUBO À PROVA DA ÁGUA — ${formatCurrency(900, "MZN", "pt-BR")}\n${URL}`,
      "cabeçalho da loja, linha do produto e URL, nessa ordem",
    );
    // os três dados mínimos do lojista: nome, preço e link da página.
    assert.ok(message.includes("BOLSA ANTI ROUBO À PROVA DA ÁGUA"));
    assert.ok(message.includes(formatCurrency(900, "MZN", "pt-BR")));
    assert.ok(message.includes(URL));
  });

  it("byte a byte idêntico ao template inline anterior (refator sem mudança)", () => {
    const storeName = "Loja X";
    const name = "Camisa de Linho";
    const price = 1200.5;
    const currency = "MZN";
    const locale = "en" as const;
    const url = "https://loja.elicani.site/store/loja/products/camisa";
    const legacy = `*${storeName}*\n${name} — ${formatCurrency(price, currency, locale)}\n${url}`;
    assert.equal(
      buildProductInquiryMessage({
        storeName,
        productName: name,
        price,
        currency,
        locale,
        productUrl: url,
      }),
      legacy,
    );
  });

  it("preço zero não quebra a mensagem (dado opcional ausente)", () => {
    const message = buildProductInquiryMessage({
      storeName: "L",
      productName: "P",
      price: 0,
      currency: "MZN",
      locale: "pt-BR",
      productUrl: URL,
    });
    assert.ok(message.includes(formatCurrency(0, "MZN", "pt-BR")));
    assert.ok(message.endsWith(URL), "URL continua presente");
  });
});

describe("productInquiryHref", () => {
  it("anexa ?text= URL-encoded ao wa.me base", () => {
    const message = `*Loja*\nProduto — MZN 900,00\n${URL}`;
    const href = productInquiryHref("https://wa.me/258841234567", message);
    assert.ok(href.startsWith("https://wa.me/258841234567?text="));
    const encoded = href.slice(href.indexOf("?text=") + "?text=".length);
    assert.ok(!encoded.includes("\n"), "quebras de linha devem estar codificadas");
    assert.ok(!encoded.includes(" "), "espaços devem estar codificados");
    assert.equal(decodeURIComponent(encoded), message);
  });
});
