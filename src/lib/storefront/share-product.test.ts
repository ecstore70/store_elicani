import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  buildShareData,
  buildShareText,
  shareProduct,
  type SharePayload,
} from "./share-product.ts";

/**
 * Testes da lógica de PARTILHA de produto (plataforma): o payload vai
 * com o produto DA CHAMADA (nunca de estado global), o Web Share API
 * nativo é preferido, o fallback copia a MESMA URL canónica e falhas
 * de clipboard nunca lançam. Fixtures multi-mercador são intencionais:
 * o módulo não conhece nenhuma loja real.
 */

const PRODUCT_A = {
  name: "Bolsa Tática",
  url: "https://merchant-a.example.com/store/store-a/products/product-a",
};
const PRODUCT_B = {
  name: "Camisa de Linho",
  url: "https://merchant-b.example.com/store/store-b/products/product-b",
};

/** Código sem comentários — o scan anti-mau-cheiro olha só ao código. */
function codeOnly(source: string): string {
  return source
    .split("\n")
    .filter((line) => !/^\s*(\/\/|\*|\/\*)/.test(line))
    .join("\n");
}

describe("shareProduct — Web Share API nativo", () => {
  it("navigator.share recebe título, texto e URL do produto em exibição", async () => {
    const seen: SharePayload[] = [];
    const outcome = await shareProduct(PRODUCT_A.name, PRODUCT_A.url, {
      share: async (data) => {
        seen.push(data);
      },
    });
    assert.equal(outcome, "shared");
    assert.equal(seen.length, 1, "navigator.share foi chamado uma vez");
    const received = seen[0];
    assert.deepEqual(received, {
      title: PRODUCT_A.name,
      text: `Check out this product: ${PRODUCT_A.name}`,
      url: PRODUCT_A.url,
    });
    // texto de divulgação conciso — NUNCA a mensagem de inquiry do
    // WhatsApp (essa continua a ser responsabilidade exclusiva do CTA).
    assert.equal(buildShareText(PRODUCT_A.name), `Check out this product: ${PRODUCT_A.name}`);
    assert.ok(!received.text.includes("wa.me"));
    assert.ok(!received.text.includes("*"), "sem formatação da mensagem de pedido");
  });

  it("produto A partilha A e produto B partilha B — sem vazamento entre chamadas", async () => {
    const seen: SharePayload[] = [];
    // O MESMO ambiente reutilizado: o módulo não guarda nada entre
    // partilhas (cada chamada usa só os seus argumentos).
    const env = {
      share: async (data: SharePayload) => {
        seen.push(data);
      },
    };
    await shareProduct(PRODUCT_A.name, PRODUCT_A.url, env);
    await shareProduct(PRODUCT_B.name, PRODUCT_B.url, env);
    assert.equal(seen.length, 2);
    assert.equal(seen[0].url, PRODUCT_A.url);
    assert.equal(seen[1].url, PRODUCT_B.url);
    assert.ok(!seen[1].url.includes("product-a"), "B nunca herda a URL de A");
    assert.ok(!seen[0].url.includes("product-b"), "A nunca herda a URL de B");
    assert.equal(seen[1].title, PRODUCT_B.name);
  });

  it("buildShareData é puro e determinístico", () => {
    assert.deepEqual(buildShareData(PRODUCT_A.name, PRODUCT_A.url), {
      title: PRODUCT_A.name,
      text: `Check out this product: ${PRODUCT_A.name}`,
      url: PRODUCT_A.url,
    });
  });
});

describe("shareProduct — fallback de clipboard", () => {
  it("sem Web Share API → copia a URL canónica exata e reporta copied", async () => {
    let copied: string | null = null;
    const outcome = await shareProduct(PRODUCT_A.name, PRODUCT_A.url, {
      writeText: async (text) => {
        copied = text;
      },
    });
    assert.equal(outcome, "copied");
    assert.equal(copied, PRODUCT_A.url, "cópia exatamente a URL do produto");
  });

  it("share falha por outro motivo → recorre à clipboard", async () => {
    let copied: string | null = null;
    const outcome = await shareProduct(PRODUCT_B.name, PRODUCT_B.url, {
      share: async () => {
        throw new Error("share not allowed");
      },
      writeText: async (text) => {
        copied = text;
      },
    });
    assert.equal(outcome, "copied");
    assert.equal(copied, PRODUCT_B.url);
  });

  it("utilizador cancela a folha nativa → não copia nem confirma", async () => {
    let copied = false;
    const outcome = await shareProduct(PRODUCT_A.name, PRODUCT_A.url, {
      share: async () => {
        throw Object.assign(new Error("share cancelled"), { name: "AbortError" });
      },
      writeText: async () => {
        copied = true;
      },
    });
    assert.equal(outcome, "cancelled");
    assert.equal(copied, false, "cancelar não pode mostrar 'Link copied'");
  });

  it("clipboard indisponível/falha → failed SEM lançar (página nunca quebra)", async () => {
    const outcome = await shareProduct(PRODUCT_A.name, PRODUCT_A.url, {
      writeText: async () => {
        throw new Error("clipboard blocked");
      },
    });
    assert.equal(outcome, "failed");
  });

  it("sem nenhuma capacidade → failed sem lançar", async () => {
    assert.equal(await shareProduct(PRODUCT_A.name, PRODUCT_A.url, {}), "failed");
  });
});

describe("share-product — isolamento de plataforma", () => {
  it("módulo sem valores de loja/mercador, sem estado e sem lógica do WhatsApp", () => {
    const source = codeOnly(
      readFileSync(new URL("./share-product.ts", import.meta.url), "utf8"),
    );
    assert.ok(!source.includes("/store/"), "nenhum caminho de loja fixo");
    assert.ok(!source.includes("wa.me"), "sem URL de WhatsApp");
    assert.ok(!source.includes("buildProductInquiryMessage"), "não mistura a mensagem de inquiry");
    assert.ok(!source.includes("productInquiryHref"), "não mistura o href do CTA");
    for (const global of ["localStorage", "sessionStorage", "document.cookie", "globalThis"]) {
      assert.ok(!source.includes(global), `sem estado global: ${global}`);
    }
  });
});
