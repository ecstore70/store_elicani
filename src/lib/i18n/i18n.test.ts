import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_LOCALE,
  getLocaleDirection,
  isSupportedLocale,
  LOCALE_LABELS,
  normalizeLocale,
  SUPPORTED_LOCALES,
} from "./config.ts";
import { en } from "./messages/en.ts";
import { createTranslator, getMessages } from "./translate.ts";

describe("idiomas suportados", () => {
  it("define os 9 idiomas iniciais em BCP 47, com en como padrão", () => {
    assert.equal(DEFAULT_LOCALE, "en");
    assert.deepEqual(
      [...SUPPORTED_LOCALES],
      ["en", "pt-BR", "pt-PT", "es", "fr", "de", "ar", "zh-Hans", "ja"],
    );
    assert.ok(SUPPORTED_LOCALES.every((locale) => isSupportedLocale(locale)));
  });

  it("cada idioma tem rótulo na própria língua", () => {
    assert.equal(Object.keys(LOCALE_LABELS).length, SUPPORTED_LOCALES.length);
    assert.equal(LOCALE_LABELS.en, "English");
    assert.equal(LOCALE_LABELS.ja, "日本語");
  });

  it("rejeita valores não suportados", () => {
    assert.ok(!isSupportedLocale("xx"));
    assert.ok(!isSupportedLocale("pt"));
    assert.ok(!isSupportedLocale(""));
    assert.ok(!isSupportedLocale(null));
    assert.ok(!isSupportedLocale(42));
  });

  it("normaliza variações de caixa e cai no padrão", () => {
    assert.equal(normalizeLocale("PT-pt"), "pt-PT");
    assert.equal(normalizeLocale("zh-hans"), "zh-Hans");
    assert.equal(normalizeLocale("EN"), "en");
    assert.equal(normalizeLocale("  fr  "), "fr");
    assert.equal(normalizeLocale("inexistente"), DEFAULT_LOCALE);
    assert.equal(normalizeLocale(null), DEFAULT_LOCALE);
    assert.equal(normalizeLocale(undefined), DEFAULT_LOCALE);
  });

  it("só árabe é RTL", () => {
    assert.equal(getLocaleDirection("ar"), "rtl");
    for (const locale of SUPPORTED_LOCALES) {
      if (locale !== "ar") assert.equal(getLocaleDirection(locale), "ltr", locale);
    }
  });
});

describe("tradutor", () => {
  it("interpola parâmetros", () => {
    const t = createTranslator("en");
    assert.equal(
      t("auth.checkEmail", { email: "maria@example.com" }),
      en["auth.checkEmail"].replace("{email}", "maria@example.com"),
    );
    assert.equal(
      t("store.error.slugTooShort", { min: 3, max: 63 }),
      en["store.error.slugTooShort"].replace("{min}", "3").replace("{max}", "63"),
    );
  });

  it("todos os idiomas registrados traduzem de verdade (sem cair no inglês)", () => {
    const english = createTranslator("en");
    // Chaves que mudam obrigatoriamente de idioma: se um catálogo não
    // estiver registrado/traduzido, elas voltariam ao inglês e o teste falha.
    const mustTranslate = [
      "nav.dashboard",
      "settings.save",
      "locale.changeLanguage",
      "landing.heroTitle1",
      "storefront.addToCart",
      "common.cancel",
    ] as const;

    for (const locale of SUPPORTED_LOCALES) {
      if (locale === "en") continue;
      const t = createTranslator(locale);
      for (const key of mustTranslate) {
        assert.notEqual(t(key), english(key), `${locale}: ${key} não traduzido`);
      }
    }
  });

  it("amostras douradas por idioma (valores que a UI renderiza)", () => {
    assert.equal(createTranslator("pt-BR")("nav.dashboard"), "Painel");
    assert.equal(createTranslator("pt-PT")("nav.settings"), "Definições");
    assert.equal(createTranslator("es")("landing.signIn"), "Iniciar sesión");
    assert.equal(createTranslator("fr")("auth.signIn"), "Se connecter");
    assert.equal(createTranslator("de")("auth.signIn"), "Anmelden");
    assert.equal(createTranslator("ar")("storefront.addToCart"), "أضف إلى السلة");
    assert.equal(createTranslator("zh-Hans")("nav.dashboard"), "仪表盘");
    assert.equal(createTranslator("ja")("locale.selectorLabel"), "言語");
  });

  it("todos os idiomas expõem o mesmo número de chaves", () => {
    const total = Object.keys(en).length;
    for (const locale of SUPPORTED_LOCALES) {
      assert.equal(Object.keys(getMessages(locale)).length, total, locale);
    }
  });

  it("nenhuma chave do catálogo fica vazia", () => {
    for (const [key, value] of Object.entries(en)) {
      assert.ok(value.trim().length > 0, `chave vazia: ${key}`);
    }
  });
});
