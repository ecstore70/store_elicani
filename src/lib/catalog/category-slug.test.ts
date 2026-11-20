import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  categorySlugOrId,
  slugifyCategoryName,
  uniqueCategorySlug,
} from "./category-slug.ts";

/**
 * Slug de categoria — PURO. O algoritmo é o de produto (partilhado de
 * propósito: uma fonte única para as duas famílias de URL), então os
 * casos espelham product-slug.test.ts com dados de categoria.
 */
describe("slugifyCategoryName", () => {
  it("normaliza nome real de categoria (acentos, caixa, espaços)", () => {
    assert.equal(slugifyCategoryName("Acessórios para Casa"), "acessorios-para-casa");
    assert.equal(slugifyCategoryName("  Roupas!!de Bebé -- "), "roupas-de-bebe");
  });

  it("colapsa símbolos e aparar hífens; sem ASCII → null", () => {
    assert.equal(slugifyCategoryName("***"), null);
    assert.equal(slugifyCategoryName("   "), null);
    assert.equal(slugifyCategoryName("عباءة"), null);
    assert.equal(slugifyCategoryName("手提包"), null);
  });

  it("respeita o teto de 63 sem terminar em hífen", () => {
    const slug = slugifyCategoryName("a".repeat(70));
    assert.equal(slug?.length, 63);
    assert.ok(slug && !slug.endsWith("-"));
  });

  it("é idempotente (rodar de novo sobre o resultado não muda nada)", () => {
    const once = slugifyCategoryName("Sapatos — Edição 2");
    assert.ok(once);
    assert.equal(slugifyCategoryName(once), once);
  });
});

describe("uniqueCategorySlug", () => {
  it("devolve o base quando está livre", () => {
    assert.equal(uniqueCategorySlug("roupas", new Set()), "roupas");
  });

  it("resolve colisão com sufixo -2, -3… (por loja)", () => {
    const taken = new Set(["roupas", "roupas-2"]);
    assert.equal(uniqueCategorySlug("roupas", taken), "roupas-3");
  });

  it("o sufixo entra DENTRO do teto de 63", () => {
    const base = "a".repeat(63);
    const result = uniqueCategorySlug(base, new Set([base]));
    assert.ok(result.length <= 63);
    assert.ok(result.endsWith("-2"));
  });
});

describe("categorySlugOrId", () => {
  it("slug quando existe (URL legível)", () => {
    assert.equal(
      categorySlugOrId({ id: "3f9d1b7e-5c2a-4d8f-9b6e-1a2c3d4e5f60", slug: "graos" }),
      "graos",
    );
  });

  it("UUID como fallback (slug null/ausente — nunca URL quebrada)", () => {
    const id = "3f9d1b7e-5c2a-4d8f-9b6e-1a2c3d4e5f60";
    assert.equal(categorySlugOrId({ id, slug: null }), id);
    assert.equal(categorySlugOrId({ id }), id);
    assert.equal(categorySlugOrId({ id, slug: "" }), id);
  });
});
