import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  addDays,
  dateKeyOf,
  midnightOf,
  RANGE_PRESETS,
  resolveRange,
  safeTimeZone,
} from "./date-range.ts";

/** "Agora" fixo para testes — 2026-01-15 10:00 UTC. */
const NOW = new Date("2026-01-15T10:00:00Z");

describe("date-range: fuso e chaves de dia", () => {
  it("safeTimeZone aceita IANA válido e cai em UTC para lixo", () => {
    assert.equal(safeTimeZone("Africa/Maputo"), "Africa/Maputo");
    assert.equal(safeTimeZone(null), "UTC");
    assert.equal(safeTimeZone(""), "UTC");
    assert.equal(safeTimeZone("Maputo/NaoExiste"), "UTC");
    assert.equal(safeTimeZone("??invalid??"), "UTC");
  });

  it("dateKeyOf devolve o dia LOCAL do fuso", () => {
    // 23:30 UTC já é o dia seguinte em Maputo (UTC+2).
    assert.equal(
      dateKeyOf(Date.parse("2026-01-15T23:30:00Z"), "Africa/Maputo"),
      "2026-01-16",
    );
    assert.equal(
      dateKeyOf(Date.parse("2026-01-15T23:30:00Z"), "UTC"),
      "2026-01-15",
    );
  });

  it("addDays cruza meses e anos", () => {
    assert.equal(addDays("2026-01-31", 1), "2026-02-01");
    assert.equal(addDays("2026-12-31", 1), "2027-01-01");
    assert.equal(addDays("2026-03-01", -1), "2026-02-28");
  });

  it("midnightOf resolve a meia-noite LOCAL", () => {
    // Meia-noite de 2026-01-15 em Maputo (UTC+2) = 2026-01-14T22:00Z.
    assert.equal(
      midnightOf("2026-01-15", "Africa/Maputo").toISOString(),
      "2026-01-14T22:00:00.000Z",
    );
    assert.equal(
      midnightOf("2026-01-15", "UTC").toISOString(),
      "2026-01-15T00:00:00.000Z",
    );
  });
});

describe("date-range: presets", () => {
  it("expõe os 6 presets iniciais", () => {
    assert.deepEqual(
      [...RANGE_PRESETS],
      ["today", "yesterday", "last7", "last30", "this_month", "prev_month"],
    );
  });

  it("today = meia-noite local da loja até à seguinte (Maputo)", () => {
    const range = resolveRange({ range: "today" }, NOW, "Africa/Maputo");
    assert.equal(range.preset, "today");
    assert.equal(range.fromKey, "2026-01-15");
    assert.equal(range.days, 1);
    assert.equal(range.from, "2026-01-14T22:00:00.000Z");
    assert.equal(range.to, "2026-01-15T22:00:00.000Z");
  });

  it("yesterday termina onde hoje começa", () => {
    const today = resolveRange({ range: "today" }, NOW, "Africa/Maputo");
    const yesterday = resolveRange({ range: "yesterday" }, NOW, "Africa/Maputo");
    assert.equal(yesterday.preset, "yesterday");
    assert.equal(yesterday.days, 1);
    assert.equal(yesterday.to, today.from);
  });

  it("last7 cobre 7 dias terminando no fim de hoje", () => {
    const range = resolveRange({ range: "last7" }, NOW, "UTC");
    assert.equal(range.days, 7);
    assert.equal(range.fromKey, "2026-01-09");
    assert.equal(range.to, "2026-01-16T00:00:00.000Z");
  });

  it("sem parâmetros cai em last30", () => {
    const range = resolveRange({}, NOW, "UTC");
    assert.equal(range.preset, "last30");
    assert.equal(range.days, 30);
    assert.equal(range.fromKey, "2025-12-17");
  });

  it("presets desconhecidos caem em last30", () => {
    const range = resolveRange({ range: "whatever" }, NOW, "UTC");
    assert.equal(range.preset, "last30");
  });

  it("this_month vai do dia 1 até ao fim de hoje", () => {
    const range = resolveRange({ range: "this_month" }, NOW, "UTC");
    assert.equal(range.fromKey, "2026-01-01");
    assert.equal(range.days, 15); // 1..15 de janeiro
    assert.equal(range.preset, "this_month");
  });

  it("prev_month cobre o mês anterior completo", () => {
    const range = resolveRange({ range: "prev_month" }, NOW, "UTC");
    assert.equal(range.fromKey, "2025-12-01");
    assert.equal(range.to, "2026-01-01T00:00:00.000Z");
    assert.equal(range.days, 31);
    assert.equal(range.preset, "prev_month");
  });

  it("parâmetro duplicado usa o primeiro valor", () => {
    const range = resolveRange(
      { range: ["last7", "today"] },
      NOW,
      "UTC",
    );
    assert.equal(range.preset, "last7");
  });
});

describe("date-range: personalizado", () => {
  it("intervalo válido vira preset custom com dias inclusivos", () => {
    const range = resolveRange(
      { from: "2026-01-10", to: "2026-01-12" },
      NOW,
      "Africa/Maputo",
    );
    assert.equal(range.preset, "custom");
    assert.equal(range.fromKey, "2026-01-10");
    assert.equal(range.days, 3); // 10, 11, 12
    assert.equal(range.from, "2026-01-09T22:00:00.000Z");
    assert.equal(range.to, "2026-01-12T22:00:00.000Z");
  });

  it("intervalo invertido é corrigido", () => {
    const range = resolveRange(
      { from: "2026-01-12", to: "2026-01-10" },
      NOW,
      "UTC",
    );
    assert.equal(range.preset, "custom");
    assert.equal(range.fromKey, "2026-01-10");
    assert.equal(range.days, 3);
  });

  it("datas impossíveis (2026-02-31) caem no padrão", () => {
    const range = resolveRange(
      { from: "2026-02-31", to: "2026-03-05" },
      NOW,
      "UTC",
    );
    assert.equal(range.preset, "last30");
  });

  it("formato errado cai no padrão", () => {
    const range = resolveRange({ from: "10/01/2026", to: "12/01/2026" }, NOW, "UTC");
    assert.equal(range.preset, "last30");
  });

  it("intervalo longo é truncado para 366 dias", () => {
    const range = resolveRange(
      { from: "2020-01-01", to: "2026-01-15" },
      NOW,
      "UTC",
    );
    assert.equal(range.preset, "custom");
    assert.equal(range.days, 366);
    assert.equal(range.fromKey, "2025-01-15"); // 366 dias até 2026-01-16
  });
});

describe("date-range: horário de verão", () => {
  it("limites de dia seguem o fuso local através da transição", () => {
    // EUA 2026: DST começa a 8 de março, 02:00 local.
    const now = new Date("2026-03-08T12:00:00Z");
    const range = resolveRange({ range: "today" }, now, "America/New_York");
    assert.equal(range.fromKey, "2026-03-08");
    // Meia-noite EST (-5) → início; meia-noite seguinte já EDT (-4): 23h.
    assert.equal(range.from, "2026-03-08T05:00:00.000Z");
    assert.equal(range.to, "2026-03-09T04:00:00.000Z");
    assert.equal(range.days, 1); // dias de CALENDÁRIO, não horas
  });
});
