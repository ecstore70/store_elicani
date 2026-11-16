import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildFaqJsonLd } from "./faq-jsonld.ts";

/** Forma dos nós do JSON-LD usada nos asserções (sem `any`). */
type FaqEntity = {
  "@type": string;
  name: string;
  acceptedAnswer: { "@type": string; text: string };
};

describe("buildFaqJsonLd", () => {
  it("devolve null sem perguntas (nenhum markup vazio)", () => {
    assert.equal(buildFaqJsonLd([]), null);
  });

  it("espelha exatamente os itens visíveis", () => {
    const items = [
      { question: "Como faço um pedido?", answer: "Fale conosco no WhatsApp." },
      { question: "Vocês entregam?", answer: "Sim, conforme a loja." },
    ];
    const data = buildFaqJsonLd(items);

    assert.ok(data);
    assert.equal(data["@context"], "https://schema.org");
    assert.equal(data["@type"], "FAQPage");

    const main = data["mainEntity"] as FaqEntity[];
    assert.equal(main.length, items.length);
    assert.equal(main[0]["@type"], "Question");
    assert.equal(main[0].name, items[0].question);
    assert.equal(main[0].acceptedAnswer["@type"], "Answer");
    assert.equal(main[0].acceptedAnswer.text, items[0].answer);
    assert.equal(main[1].name, items[1].question);
  });

  it("não acrescenta campos além do schema (sem dados inventados)", () => {
    const data = buildFaqJsonLd([{ question: "Q", answer: "A" }]);
    assert.ok(data);
    assert.deepEqual(Object.keys(data).sort(), [
      "@context",
      "@type",
      "mainEntity",
    ]);
    const main = data["mainEntity"] as FaqEntity[];
    assert.deepEqual(Object.keys(main[0]).sort(), [
      "@type",
      "acceptedAnswer",
      "name",
    ]);
  });
});
