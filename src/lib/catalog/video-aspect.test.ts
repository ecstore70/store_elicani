import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveVideoAspect } from "./video-aspect.ts";

describe("resolveVideoAspect", () => {
  it("preserva as dimensões intrínsecas (9:16, 16:9 e quadrado)", () => {
    assert.deepEqual(resolveVideoAspect(1080, 1920), { w: 1080, h: 1920 });
    assert.deepEqual(resolveVideoAspect(1920, 1080), { w: 1920, h: 1080 });
    assert.deepEqual(resolveVideoAspect(1080, 1080), { w: 1080, h: 1080 });
  });

  it("mantém proporções incomuns sem reduzir (ex.: 4:5)", () => {
    assert.deepEqual(resolveVideoAspect(1080, 1350), { w: 1080, h: 1350 });
    assert.deepEqual(resolveVideoAspect(720, 1280), { w: 720, h: 1280 });
  });

  it("cai para 16:9 quando o metadata é ausente ou inválido", () => {
    assert.deepEqual(resolveVideoAspect(0, 0), { w: 16, h: 9 });
    assert.deepEqual(resolveVideoAspect(0, 1080), { w: 16, h: 9 });
    assert.deepEqual(resolveVideoAspect(1920, 0), { w: 16, h: 9 });
    assert.deepEqual(resolveVideoAspect(-1, -1), { w: 16, h: 9 });
    assert.deepEqual(resolveVideoAspect(Number.NaN, 1080), { w: 16, h: 9 });
    assert.deepEqual(
      resolveVideoAspect(1920, Number.POSITIVE_INFINITY),
      { w: 16, h: 9 },
    );
  });

  it("devolve uma cópia (mutação do resultado não contamina o fallback)", () => {
    const a = resolveVideoAspect(0, 0);
    a.w = 99;
    assert.deepEqual(resolveVideoAspect(0, 0), { w: 16, h: 9 });
  });
});
