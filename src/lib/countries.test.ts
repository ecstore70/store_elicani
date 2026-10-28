import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { COUNTRY_CODES, getCountryName, getCountries, isValidCountry } from "./countries.ts";

describe("COUNTRY_CODES — ISO 3166-1 alpha-2", () => {
  it("é uma lista ampla, única e bem formada", () => {
    assert.ok(COUNTRY_CODES.length >= 240, `apenas ${COUNTRY_CODES.length}`);
    assert.equal(new Set(COUNTRY_CODES).size, COUNTRY_CODES.length);
    assert.ok(COUNTRY_CODES.every((code) => /^[A-Z]{2}$/.test(code)));
  });

  it("cobre os mercados iniciais do Elicani", () => {
    const markets = [
      "MZ", // Moçambique
      "BR", // Brasil
      "PT", // Portugal
      "US",
      "GB",
      "FR",
      "DE",
      "ES",
      "CN",
      "JP",
      "IN",
      "ZA",
      "AO",
      "NG",
      "KE",
      "GH",
      "CA",
      "AU",
    ];

    for (const code of markets) {
      assert.ok(isValidCountry(code), `${code} deve ser válido`);
    }
  });

  it("rejeita códigos inexistentes e malformados", () => {
    assert.ok(!isValidCountry("ZZ"));
    assert.ok(!isValidCountry("M"));
    assert.ok(!isValidCountry("moz"));
    assert.ok(!isValidCountry(""));
  });
});

describe("getCountryName — nomes via Intl.DisplayNames", () => {
  it("resolve o nome no idioma pedido", () => {
    assert.equal(getCountryName("MZ", "en"), "Mozambique");
    assert.equal(getCountryName("MZ", "pt-BR"), "Moçambique");
  });

  it("faz fallback para o próprio código quando desconhecido", () => {
    assert.equal(getCountryName("ZZ", "en"), "ZZ");
    assert.equal(getCountryName("", "en"), "");
  });

  it("getCountries devolve code+label ordenados", () => {
    const list = getCountries("en");
    assert.equal(list.length, COUNTRY_CODES.length);
    assert.ok(
      list.every((country) => country.code.length === 2 && country.name.length > 0),
    );

    const names = list.map((country) => country.name);
    assert.deepEqual(names, [...names].sort((a, b) => a.localeCompare(b, "en")));
  });
});
