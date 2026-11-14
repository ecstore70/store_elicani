import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  productSlugOrId,
  PRODUCT_SLUG_MAX_LENGTH,
  slugifyProductName,
  uniqueProductSlug,
} from "./product-slug.ts";

describe("slugifyProductName", () => {
  it("normaliza nome real de produto (acentos, caixa, espaços)", () => {
    assert.equal(
      slugifyProductName("BOLSA ANTI ROBÔ APROVA DA ÁGUA"),
      "bolsa-anti-robo-aprova-da-agua",
    );
    assert.equal(slugifyProductName("Café Expresso 500g"), "cafe-expresso-500g");
  });

  it("colapsa símbolos e aparar hífens", () => {
    assert.equal(slugifyProductName("  --Camisa!!de -- Lisboa-- "), "camisa-de-lisboa");
    assert.equal(slugifyProductName("***"), null);
    assert.equal(slugifyProductName(""), null);
    assert.equal(slugifyProductName("   "), null);
  });

  it("devolve null para grafia sem caracteres ASCII", () => {
    assert.equal(slugifyProductName("عباءة"), null);
    assert.equal(slugifyProductName("手提包"), null);
  });

  it("respeita o teto de 63 sem terminar em hífen", () => {
    const slug = slugifyProductName("a".repeat(70));
    assert.equal(slug?.length, PRODUCT_SLUG_MAX_LENGTH);
    assert.ok(slug && !slug.endsWith("-"));

    const slug2 = slugifyProductName(`${"a".repeat(62)} bbbb`);
    assert.ok(slug2 && slug2.length <= PRODUCT_SLUG_MAX_LENGTH);
    assert.ok(slug2 && !slug2.endsWith("-"));
  });

  it("é idempotente (rodar de novo sobre o resultado não muda nada)", () => {
    const once = slugifyProductName("Tênis Nike Air — Edição 2");
    assert.ok(once);
    assert.equal(slugifyProductName(once), once);
  });
});

describe("uniqueProductSlug", () => {
  it("devolve o base quando está livre", () => {
    assert.equal(uniqueProductSlug("bolsa", new Set()), "bolsa");
  });

  it("incrementa sufixo até achar espaço", () => {
    const taken = new Set(["bolsa", "bolsa-2", "bolsa-3"]);
    assert.equal(uniqueProductSlug("bolsa", taken), "bolsa-4");
  });

  it("o sufixo cabe dentro do teto de 63", () => {
    const base = "a".repeat(PRODUCT_SLUG_MAX_LENGTH);
    const taken = new Set([base]);
    const next = uniqueProductSlug(base, taken);
    assert.equal(next.length, PRODUCT_SLUG_MAX_LENGTH);
    assert.ok(next.endsWith("-2"));
    assert.equal(next, `${"a".repeat(PRODUCT_SLUG_MAX_LENGTH - 2)}-2`);
  });
});

describe("productSlugOrId", () => {
  it("prefere slug; cai para UUID quando slug é null/vazio", () => {
    assert.equal(productSlugOrId({ id: "uuid-1", slug: "bolsa" }), "bolsa");
    assert.equal(productSlugOrId({ id: "uuid-1", slug: null }), "uuid-1");
    assert.equal(productSlugOrId({ id: "uuid-1", slug: "" }), "uuid-1");
    assert.equal(productSlugOrId({ id: "uuid-1" }), "uuid-1");
  });
});
