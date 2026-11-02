import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  discountPercent,
  firstUnselectedRequired,
  optionsSignature,
  selectedOptionsPrice,
  type ProductOptionGroup,
} from "./product-options.ts";

/** Helpers PUROS da estrutura genérica de opções de produto. */

const sizeGroup: ProductOptionGroup = {
  id: "size",
  label: "Size",
  type: "single",
  required: true,
  choices: [
    { id: "m", label: "Medium", priceDelta: 0 },
    { id: "l", label: "Large", priceDelta: 200 },
  ],
};

const extrasGroup: ProductOptionGroup = {
  id: "extras",
  label: "Extras",
  type: "multi",
  required: false,
  choices: [
    { id: "gift", label: "Gift wrap", priceDelta: 50 },
    { id: "rush", label: "Rush", priceDelta: -10 },
  ],
};

describe("optionsSignature", () => {
  it("linha sem opções fica sem assinatura (mesma identidade do produto puro)", () => {
    assert.equal(optionsSignature([]), "");
  });

  it("é independente da ordem das escolhas", () => {
    const a = [
      { groupLabel: "Size", choiceLabel: "Large", priceDelta: 200 },
      { groupLabel: "Extras", choiceLabel: "Gift", priceDelta: 50 },
    ];
    const b = [...a].reverse();
    assert.equal(optionsSignature(a), optionsSignature(b));
  });

  it("escolhas diferentes geram assinaturas diferentes", () => {
    const large = [{ groupLabel: "Size", choiceLabel: "Large", priceDelta: 200 }];
    const medium = [{ groupLabel: "Size", choiceLabel: "Medium", priceDelta: 0 }];
    assert.notEqual(optionsSignature(large), optionsSignature(medium));
  });
});

describe("selectedOptionsPrice", () => {
  it("soma acréscimos positivos e negativos; vazio é zero", () => {
    assert.equal(selectedOptionsPrice([]), 0);
    assert.equal(
      selectedOptionsPrice([
        { groupLabel: "Size", choiceLabel: "Large", priceDelta: 200 },
        { groupLabel: "Extras", choiceLabel: "Rush", priceDelta: -10 },
      ]),
      190,
    );
  });
});

describe("firstUnselectedRequired", () => {
  it("sem grupos → nada por escolher", () => {
    assert.equal(firstUnselectedRequired([], {}), null);
  });

  it("grupo obrigatório por escolher devolve o rótulo", () => {
    assert.equal(
      firstUnselectedRequired([sizeGroup, extrasGroup], {}),
      "Size",
    );
    assert.equal(
      firstUnselectedRequired([sizeGroup], { size: [] }),
      "Size",
    );
  });

  it("obrigatório escolhido → null (mesmo que o opcional fique vazio)", () => {
    assert.equal(
      firstUnselectedRequired([sizeGroup, extrasGroup], { size: ["l"] }),
      null,
    );
  });

  it("grupo opcional nunca bloqueia", () => {
    assert.equal(firstUnselectedRequired([extrasGroup], {}), null);
  });
});

describe("discountPercent", () => {
  it("sem promoção, promoção ≥ preço ou preço inválido → 0", () => {
    assert.equal(discountPercent(1000, null), 0);
    assert.equal(discountPercent(1000, 1000), 0);
    assert.equal(discountPercent(1000, 1200), 0);
    assert.equal(discountPercent(0, 500), 0);
  });

  it("calcula e arredonda o desconto", () => {
    assert.equal(discountPercent(1000, 500), 50);
    assert.equal(discountPercent(1000, 850), 15);
    assert.equal(discountPercent(1200, 800), 33);
  });
});
