import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createRateGate } from "./rate-limit.ts";

/** Relógio falso para simular a janela deslizante. */
function fakeClock(start = 1_000_000) {
  let now = start;
  return {
    now: () => now,
    advance(ms: number) {
      now += ms;
    },
  };
}

describe("createRateGate", () => {
  it("permite até `limit` chamadas dentro da janela", () => {
    const clock = fakeClock();
    const gate = createRateGate({ limit: 3, windowMs: 60_000, now: clock.now });

    assert.equal(gate.check("user-1"), true);
    assert.equal(gate.check("user-1"), true);
    assert.equal(gate.check("user-1"), true);
    assert.equal(gate.check("user-1"), false, "4ª chamada na janela deve falhar");
  });

  it("libera de novo quando a janela desliza para além do primeiro hit", () => {
    const clock = fakeClock();
    const gate = createRateGate({ limit: 2, windowMs: 60_000, now: clock.now });

    assert.equal(gate.check("u"), true); // t=0
    clock.advance(30_000);
    assert.equal(gate.check("u"), true); // t=30s — 2/2 na janela
    clock.advance(10_000);
    assert.equal(gate.check("u"), false); // t=40s — ainda 2/2

    // t=65s: o hit de t=0 saiu da janela → sobra 1 slot livre.
    clock.advance(25_000);
    assert.equal(gate.check("u"), true);
    assert.equal(gate.check("u"), false, "de novo 2/2 (t=30s + t=65s)");
  });

  it("chaves são independentes (um usuário não bloqueia o outro)", () => {
    const clock = fakeClock();
    const gate = createRateGate({ limit: 1, windowMs: 60_000, now: clock.now });

    assert.equal(gate.check("a"), true);
    assert.equal(gate.check("a"), false);
    assert.equal(gate.check("b"), true);
    assert.equal(gate.check("b"), false);
  });

  it("limite 0 bloqueia tudo", () => {
    const gate = createRateGate({ limit: 0, windowMs: 60_000 });
    assert.equal(gate.check("x"), false);
    assert.equal(gate.check("x"), false);
  });

  it("não acumula hits antigos para sempre (limpa fora da janela)", () => {
    const clock = fakeClock();
    const gate = createRateGate({ limit: 2, windowMs: 1_000, now: clock.now });

    assert.equal(gate.check("u"), true);
    clock.advance(10_000); // bem além da janela
    assert.equal(gate.check("u"), true);
    assert.equal(gate.check("u"), true); // o hit antigo não conta mais
  });
});
