import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SUPPORTED_LOCALES } from "../i18n/config.ts";
import { createTranslator } from "../i18n/translate.ts";
import { buildStorefrontStrings } from "./strings.ts";
import {
  BOTTOM_ARC_PATH,
  DOT_R,
  FS_MAX,
  R_TEXT,
  ROSETTE_PATH,
  SEAL_FS_READABLE,
  TOP_ARC_PATH,
  layoutSeal,
  rosettePath,
  sealArcId,
  splitSealLines,
  textWidthUnits,
  type SealLayout,
} from "./seal-layout.ts";

/**
 * Contrato dos selos do rodapé:
 *
 *  • a quebra em linhas é previsível (palavra, depois de hífen, ≤ 3);
 *  • a fonte resultante é LEGÍVEL (≥ 10) e o texto CAIBE no círculo em
 *    TODOS os 9 idiomas — tradução longa nunca destrói o selo;
 *  • a roseta e os arcos da marca têm a geometria esperada;
 *  • nenhum texto vira promessa inventada (sem "100%", "garantido",
 *    "certificado") nem emoji.
 */

const SEAL_KEYS = ["sealCatalog", "sealMenu", "sealOrders", "sealSupport"] as const;

/** Emoji/símbolos decorativos proibidos nos textos dos selos. */
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/u;

/** Afirma que nenhuma linha/canto ultrapassa o raio seguro do selo. */
function assertFits(layout: SealLayout, label: string): void {
  layout.lines.forEach((line, index) => {
    const half = (textWidthUnits(line) * layout.fs) / 2;
    const capTop = layout.baselines[index] - 0.72 * layout.fs;
    for (const dy of [Math.abs(capTop - 50), Math.abs(layout.baselines[index] - 50)]) {
      const corner = Math.hypot(half, dy);
      assert.ok(
        corner <= R_TEXT + 0.05,
        `${label}: canto do texto em ${corner.toFixed(2)} > ${R_TEXT} — "${line}"`,
      );
    }
  });
  const dots = Math.hypot(5.2, layout.dotsY - 50) + DOT_R;
  assert.ok(dots <= R_TEXT, `${label}: pontinhos fora do disco (${dots.toFixed(2)})`);
}

describe("selos — quebra em linhas", () => {
  it("separa por palavra, uma linha por palavra (até 3)", () => {
    assert.deepEqual(splitSealLines("Pedidos via WhatsApp"), [
      "PEDIDOS",
      "VIA",
      "WHATSAPP",
    ]);
    assert.deepEqual(splitSealLines("Contato direto"), ["CONTATO", "DIRETO"]);
  });

  it("quebra DEPOIS do hífen (alemão não perde o travessão)", () => {
    assert.deepEqual(splitSealLines("Online-Katalog"), ["ONLINE-", "KATALOG"]);
  });

  it("palavra única vira linha única; 4+ palavras viram 2 linhas equilibradas", () => {
    assert.deepEqual(splitSealLines("direto"), ["DIRETO"]);
    assert.deepEqual(splitSealLines("um dois três quatro"), [
      "UM DOIS",
      "TRÊS QUATRO",
    ]);
  });

  it("maiúsculas: a medição é a do texto renderizado", () => {
    assert.deepEqual(splitSealLines("catálogo online"), ["CATÁLOGO", "ONLINE"]);
  });
});

describe("selos — layout", () => {
  it("resolve fonte legível e encaixa no círculo (exemplo real pt-BR)", () => {
    const layout = layoutSeal("Pedidos via WhatsApp");
    assert.equal(layout.lines.length, 3);
    assert.ok(layout.fs >= SEAL_FS_READABLE, `fs ${layout.fs} < ${SEAL_FS_READABLE}`);
    assert.ok(layout.fs <= FS_MAX);
    // linhas de cima para baixo, pontinhos depois da última linha
    for (let i = 1; i < layout.baselines.length; i++) {
      assert.ok(layout.baselines[i] > layout.baselines[i - 1]);
    }
    assert.ok(layout.dotsY > layout.baselines.at(-1)!);
    assertFits(layout, "pt-BR pedidos");
  });

  it("linha única longa em CJK quebra no meio (japonês sem espaços)", () => {
    const layout = layoutSeal("オンラインカタログ");
    assert.deepEqual(layout.lines, ["オンライン", "カタログ"]);
    assert.ok(layout.fs >= SEAL_FS_READABLE);
    assertFits(layout, "ja catálogo");
  });

  it("a roseta tem 28 picotes, fecha com Z e não passa do viewBox", () => {
    const d = rosettePath();
    assert.match(d, /^M [\d.]+ [\d.]+( A [\d.]+ [\d.]+ 0 0 1 [\d.]+ [\d.]+){28} Z$/);
    assert.equal(ROSETTE_PATH, d);
    // extremos de todos os pontos (picote estende ~1.8 além de r=46.5)
    const numbers = d.match(/[\d.]+/g)!.map(Number);
    const xs = numbers.filter((_, i) => i % 2 === 0);
    const ys = numbers.filter((_, i) => i % 2 === 1);
    assert.ok(Math.min(...xs, ...ys.map((y) => 100 - y)) >= 0, "fora do viewBox");
    assert.ok(Math.max(...xs, ...ys) <= 100, "fora do viewBox");
  });

  it("arcos da marca: topo horizontais e base de cabeça para cima", () => {
    // topo: semicírculo de 9h a 3h (sentido horário → sweep 1)
    assert.match(TOP_ARC_PATH, /^M 14\.60? 50 A 35\.4 35\.4 0 0 1 85\.40? 50$/);
    // base: 7h30 → 4h30 anti-horário (sweep 0) — letras sempre legíveis
    assert.match(BOTTOM_ARC_PATH, /^M 22\.35 77\.65 A 39\.1 39\.1 0 0 0 77\.65 77\.65$/);
  });

  it("id dos arcos é determinístico e distinto por texto (SSR = CSR)", () => {
    assert.equal(sealArcId("Pedidos via WhatsApp"), sealArcId("Pedidos via WhatsApp"));
    assert.notEqual(sealArcId("Pedidos via WhatsApp"), sealArcId("Contato direto"));
    assert.match(sealArcId("Contato direto"), /^sf-seal-[a-z0-9]+$/);
  });
});

describe("selos — todos os idiomas suportados", () => {
  for (const locale of SUPPORTED_LOCALES) {
    it(`${locale}: textos curtos, legíveis e contidos no círculo`, () => {
      const strings = buildStorefrontStrings(createTranslator(locale));
      for (const key of SEAL_KEYS) {
        const text = strings[key];
        const label = `${locale}.${key}`;

        // curto o bastante para viver num selo (uma frase não é selo)
        assert.ok(text.length <= 28, `${label}: texto longo demais — "${text}"`);
        assert.ok(!EMOJI.test(text), `${label}: emoji no texto`);
        assert.ok(text.trim().length > 0, `${label}: vazio`);

        const layout = layoutSeal(text);
        assert.ok(layout.lines.length <= 3, `${label}: ${layout.lines.length} linhas`);
        assert.ok(
          layout.fs >= SEAL_FS_READABLE,
          `${label}: fs ${layout.fs.toFixed(2)} < ${SEAL_FS_READABLE} — "${text}"`,
        );
        assertFits(layout, label);
      }
    });
  }

  it("nenhum texto promete certificação/garantia inventada", () => {
    const banned =
      /\b(100%|guarantee[ds]?|certified|certified store|verified seller|safe purchase|satisfaction)\b/i;
    for (const locale of SUPPORTED_LOCALES) {
      const strings = buildStorefrontStrings(createTranslator(locale));
      for (const key of SEAL_KEYS) {
        assert.ok(
          !banned.test(strings[key]),
          `${locale}.${key}: promessa indevida — "${strings[key]}"`,
        );
      }
    }
  });
});
