import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_CURRENCY,
  formatCurrency,
  formatNumber,
  getCurrencyLabel,
  isSupportedCurrency,
  SUPPORTED_CURRENCIES,
} from "./currency.ts";

/**
 * O Intl usa espaço NÃO-quebrável (U+00A0) entre símbolo e valor.
 * Normalizamos só para as asserções não falharem por whitespace invisível.
 */
const plain = (value: string): string => value.replace(/\u00a0/g, " ");

describe("moedas suportadas", () => {
  it("cobre as 15 moedas iniciais (ISO 4217)", () => {
    const required = [
      "USD",
      "EUR",
      "GBP",
      "CAD",
      "AUD",
      "BRL",
      "MZN",
      "ZAR",
      "AOA",
      "NGN",
      "KES",
      "GHS",
      "INR",
      "CNY",
      "JPY",
    ];

    for (const code of required) {
      assert.ok(isSupportedCurrency(code), `${code} deve ser suportada`);
    }
    assert.equal(SUPPORTED_CURRENCIES.length, required.length);
  });

  it("códigos são únicos e têm 3 letras maiúsculas", () => {
    const codes = SUPPORTED_CURRENCIES.map((currency) => currency.code);
    assert.equal(new Set(codes).size, codes.length);
    assert.ok(codes.every((code) => /^[A-Z]{3}$/.test(code)));
    assert.ok(SUPPORTED_CURRENCIES.every((currency) => currency.label.length > 0));
  });

  it("a moeda padrão é internacional, não de um país", () => {
    assert.equal(DEFAULT_CURRENCY, "USD");
    assert.ok(isSupportedCurrency(DEFAULT_CURRENCY));
  });
});

describe("formatCurrency — Intl.NumberFormat, sem símbolos hardcoded", () => {
  it("formata as mesmas moedas em vários idiomas", () => {
    assert.equal(plain(formatCurrency(1234.56, "USD", "en")), "$1,234.56");
    assert.equal(plain(formatCurrency(1234.56, "USD", "pt-BR")), "US$ 1.234,56");
    assert.equal(plain(formatCurrency(1234.56, "BRL", "pt-BR")), "R$ 1.234,56");
  });

  it("cada moeda tem formato próprio (MZN, EUR)", () => {
    const mzn = formatCurrency(1234.56, "MZN", "en");
    const eur = formatCurrency(1234.56, "EUR", "en");
    assert.match(mzn, /MZN/);
    assert.match(mzn, /1,234\.56/);
    assert.match(eur, /€/);
    assert.notEqual(mzn, eur);
    assert.notEqual(mzn, formatCurrency(1234.56, "USD", "en"));
  });

  it("respeita as casas decimais da moeda (JPY não tem)", () => {
    const jpy = formatCurrency(1234.56, "JPY", "en");
    assert.doesNotMatch(jpy, /\./);
    assert.match(jpy, /1,235/);
  });

  it("mesmo valor, moedas diferentes → formatos diferentes", () => {
    const usd = formatCurrency(1234.56, "USD", "en");
    const brl = formatCurrency(1234.56, "BRL", "en");
    const mzn = formatCurrency(1234.56, "MZN", "en");
    assert.equal(new Set([usd, brl, mzn]).size, 3);
  });

  it("não lança exceção com moeda desconhecida", () => {
    assert.equal(formatCurrency(10, "XYZ", "en"), "XYZ 10.00");
    assert.equal(formatCurrency(10, "", "en"), " 10.00");
  });
});

describe("rótulos e números", () => {
  it("nomeia a moeda no idioma pedido", () => {
    assert.equal(getCurrencyLabel("USD", "en"), "US Dollar");
    assert.ok(getCurrencyLabel("MZN", "pt-BR").length > 0);
    assert.equal(getCurrencyLabel("XYZ", "en"), "XYZ");
  });

  it("formata contadores conforme o idioma", () => {
    assert.equal(formatNumber(1234567, "en"), "1,234,567");
    assert.ok(formatNumber(1234567, "pt-BR").includes("."));
  });
});
