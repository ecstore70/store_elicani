import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isReservedSlug,
  RESERVED_SLUGS,
  SLUG_MAX_LENGTH,
  slugify,
  validateSlug,
} from "./slug.ts";

describe("slugify", () => {
  it("converte nomes com espaços e acentos", () => {
    assert.equal(slugify("Maria Fashion"), "maria-fashion");
    assert.equal(slugify("Café & Filhos"), "cafe-filhos");
    assert.equal(slugify("  Loja   da Ç & Filhos  "), "loja-da-c-filhos");
  });

  it("remove hífens inválidos e colapsa repetições", () => {
    assert.equal(slugify("a--b"), "a-b");
    assert.equal(slugify("---x---"), "x");
    assert.equal(slugify("!!!"), "");
  });

  it("respeita o limite de um label de domínio", () => {
    assert.equal(slugify("a".repeat(200)).length, SLUG_MAX_LENGTH);
  });

  it("produz sempre um slug que passa na validação", () => {
    for (const name of ["Maria Fashion", "Café & Filhos", "Loja 2024", "ZARA"]) {
      assert.equal(validateSlug(slugify(name)), null, name);
    }
  });
});

describe("validateSlug", () => {
  it("aceita slugs válidos", () => {
    for (const slug of ["maria", "joao", "moda-fashion", "loja2", "a1b"]) {
      assert.equal(validateSlug(slug), null, slug);
    }
  });

  it("rejeita vazio", () => {
    assert.equal(validateSlug(""), "empty");
    assert.equal(validateSlug("   "), "empty");
  });

  it("rejeita comprimento inválido", () => {
    assert.equal(validateSlug("ab"), "too_short");
    assert.equal(validateSlug("a".repeat(64)), "too_long");
  });

  it("rejeita caracteres que quebrariam o hostname", () => {
    for (const slug of [
      "Mariana",
      "maria fashion",
      "-comeca-com-hifen",
      "termina-com-hifen-",
      "a--b",
      "café",
      "ponto.com",
      "under_score",
      "mais+sinal",
    ]) {
      assert.equal(validateSlug(slug), "invalid", slug);
    }
  });

  it("rejeita todas as palavras reservadas", () => {
    const requiredBySpec = [
      "app",
      "admin",
      "api",
      "www",
      "login",
      "signup",
      "dashboard",
      "settings",
      "support",
      "help",
      "docs",
      "status",
    ];

    for (const slug of requiredBySpec) {
      assert.ok(RESERVED_SLUGS.includes(slug), `${slug} deve ser reservado`);
      assert.equal(validateSlug(slug), "reserved", slug);
      assert.ok(isReservedSlug(slug), slug);
    }
  });

  it("a lista de reservados não contém duplicados", () => {
    assert.equal(new Set(RESERVED_SLUGS).size, RESERVED_SLUGS.length);
  });
});
