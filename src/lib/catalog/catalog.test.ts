import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createTranslator } from "../i18n/translate.ts";
import { emptyProductFormValues } from "./types.ts";
import { validateProductValues } from "./validate.ts";
import {
  DEFAULT_APPEARANCE,
  normalizeAppearance,
  STORE_TEMPLATES,
  isOneOf,
  isValidHexColor,
} from "../stores/appearance.ts";
import {
  readableColorOn,
  relativeLuminance,
  resolveTheme,
} from "../storefront/theme.ts";

const t = createTranslator("en");

function values(
  overrides: Partial<ReturnType<typeof emptyProductFormValues>> = {},
) {
  return { ...emptyProductFormValues(), ...overrides };
}

describe("validação de produto", () => {
  it("aceita um produto mínimo válido", () => {
    const errors = validateProductValues(values({ name: "Camisa", price: "99.9" }), t);
    assert.deepEqual(errors, {});
  });

  it("aceita preço e promoção válidos com imagem https e categoria", () => {
    const errors = validateProductValues(
      values({
        name: "Produto completo",
        description: "Detalhes",
        price: "1000.00",
        promo_price: "800.50",
        image_url: "https://exemplo.com/foto.jpg",
        category_id: "abc",
      }),
      t,
    );
    assert.deepEqual(errors, {});
  });

  it("exige nome", () => {
    assert.ok(validateProductValues(values({ price: "10" }), t).name);
  });

  it("rejeita nome longo demais", () => {
    const errors = validateProductValues(
      values({ name: "x".repeat(121), price: "10" }),
      t,
    );
    assert.ok(errors.name);
  });

  it("rejeita preço inválido (letras, negativo, casas demais)", () => {
    assert.ok(validateProductValues(values({ name: "A", price: "abc" }), t).price);
    assert.ok(validateProductValues(values({ name: "A", price: "-5" }), t).price);
    assert.ok(validateProductValues(values({ name: "A", price: "10.123" }), t).price);
    assert.ok(validateProductValues(values({ name: "A", price: "" }), t).price);
  });

  it("exige promoção menor que o preço", () => {
    const errors = validateProductValues(
      values({ name: "A", price: "100", promo_price: "100" }),
      t,
    );
    assert.ok(errors.promo_price);
    const higher = validateProductValues(
      values({ name: "A", price: "100", promo_price: "150" }),
      t,
    );
    assert.ok(higher.promo_price);
  });

  it("aceita promoção menor e caminho relativo de imagem", () => {
    const errors = validateProductValues(
      values({ name: "A", price: "100", promo_price: "80", image_url: "/uploads/a.jpg" }),
      t,
    );
    assert.deepEqual(errors, {});
  });

  it("rejeita imagem que não é link nem caminho", () => {
    const errors = validateProductValues(
      values({ name: "A", price: "10", image_url: "javascript:alert(1)" }),
      t,
    );
    assert.ok(errors.image_url);
  });

  it("rejeita descrição longa demais", () => {
    const errors = validateProductValues(
      values({ name: "A", price: "10", description: "x".repeat(1001) }),
      t,
    );
    assert.ok(errors.description);
  });
});

describe("aparência (domínio)", () => {
  it("valida cores hex e normaliza para minúsculas", () => {
    assert.ok(isValidHexColor("#2563EB"));
    assert.ok(!isValidHexColor("#fff"));
    assert.ok(!isValidHexColor("red"));
    assert.equal(normalizeAppearance({ primary_color: "#AABBCC" }).primary_color, "#aabbcc");
  });

  it("cai nos defaults com valores inválidos", () => {
    const appearance = normalizeAppearance({
      template: "govinda",
      product_layout: "carousel",
      image_ratio: "wide",
      button_style: "neon",
      card_style: "glass",
      accent_color: "not-a-color",
    });
    assert.deepEqual(appearance, DEFAULT_APPEARANCE);
  });

  it("mantém opções válidas", () => {
    const appearance = normalizeAppearance({
      template: "restaurant",
      product_layout: "list",
      image_ratio: "portrait",
      button_style: "compact",
      card_style: "minimal",
    });
    assert.equal(appearance.template, "restaurant");
    assert.equal(appearance.product_layout, "list");
    assert.equal(appearance.image_ratio, "portrait");
    assert.equal(appearance.button_style, "compact");
    assert.equal(appearance.card_style, "minimal");
  });

  it("isOneOf só aceita membros da lista", () => {
    assert.ok(isOneOf("market", STORE_TEMPLATES));
    assert.ok(!isOneOf("shop", STORE_TEMPLATES));
    assert.ok(!isOneOf(42, STORE_TEMPLATES));
  });
});

describe("tema da vitrine", () => {
  it("luminância: branco > cinza > preto", () => {
    assert.ok(relativeLuminance("#ffffff") > relativeLuminance("#808080"));
    assert.ok(relativeLuminance("#808080") > relativeLuminance("#000000"));
  });

  it("texto legível: escuro sobre fundo claro, claro sobre fundo escuro", () => {
    assert.equal(readableColorOn("#ffffff"), "#0f172a");
    assert.equal(readableColorOn("#0f172a"), "#f8fafc");
  });

  it("resolve vars do tema com defaults por template", () => {
    const theme = resolveTheme(DEFAULT_APPEARANCE);
    assert.equal(theme.template, "minimal");
    assert.equal(theme.cssVars["--sf-primary"], "#0f172a");
    assert.equal(theme.cssVars["--sf-bg"], "#ffffff");
    assert.ok(theme.cssVars["--sf-gap"]);
    assert.ok(theme.cssVars["--sf-img-ratio"]);
  });

  it("cores do comerciante sobrepõem os defaults e afetam o texto", () => {
    const theme = resolveTheme({
      ...DEFAULT_APPEARANCE,
      template: "market",
      primary_color: "#2563eb",
      background_color: "#000000",
      button_style: "compact",
      card_style: "rounded",
    });
    assert.equal(theme.cssVars["--sf-primary"], "#2563eb");
    assert.equal(theme.cssVars["--sf-button"], "#2563eb");
    assert.equal(theme.cssVars["--sf-bg"], "#000000");
    // fundo preto → texto claro, nunca ilegível
    assert.equal(theme.cssVars["--sf-fg"], "#f8fafc");
    assert.equal(theme.cssVars["--sf-btn-radius"], "0.375rem");
    assert.equal(theme.cssVars["--sf-radius"], "1.25rem");
  });

  it("botão com cor própria usa texto legível sobre o botão", () => {
    const theme = resolveTheme({
      ...DEFAULT_APPEARANCE,
      button_color: "#ffffff",
    });
    assert.equal(theme.cssVars["--sf-on-button"], "#0f172a");
  });
});
