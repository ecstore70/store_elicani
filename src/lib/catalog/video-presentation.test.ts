import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  FALLBACK_VIDEO_ASPECT,
  VIDEO_PRESENTATION_ASPECT,
  resolveYoutubeAspect,
  videoFrameStyle,
  youtubePresentation,
} from "./video-presentation.ts";

/** URLs reais do catálogo production (Shorts gravados pelo lojista). */
const LEGACY_SHORT = "https://youtube.com/shorts/JKoL8v7bfB0";
const SHORT_WITH_QUERY = "https://www.youtube.com/shorts/GfRWFZrM9ec?si=4g1zcr2YvAaxtTiG";

/** Formas de URL SEM dica de orientação (não inventa dimensões). */
const WATCH = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
const SHORT_LINK = "https://youtu.be/dQw4w9WgXcQ";
const EMBED = "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ";
const LIVE = "https://www.youtube.com/live/dQw4w9WgXcQ";

describe("youtubePresentation — dica de orientação pela forma do URL", () => {
  it("Short (/shorts/) → portrait; formas sem dica → null", () => {
    assert.equal(youtubePresentation(LEGACY_SHORT), "portrait");
    assert.equal(youtubePresentation(SHORT_WITH_QUERY), "portrait");
    assert.equal(youtubePresentation(WATCH), null);
    assert.equal(youtubePresentation(SHORT_LINK), null);
    assert.equal(youtubePresentation(EMBED), null);
    assert.equal(youtubePresentation(LIVE), null);
  });

  it("não-YouTube, host estranho e URL inválido → null", () => {
    assert.equal(youtubePresentation("https://example.com/shorts/JKoL8v7bfB0"), null);
    assert.equal(youtubePresentation("https://vimeo.com/123456789"), null);
    assert.equal(youtubePresentation("não é um url"), null);
    assert.equal(youtubePresentation(""), null);
  });
});

describe("resolveYoutubeAspect — moldura do player de YouTube", () => {
  it("Short → moldura 9:16 (registro legado JKoL8v7bfB0 incluído)", () => {
    assert.deepEqual(resolveYoutubeAspect(LEGACY_SHORT), { w: 9, h: 16 });
    assert.deepEqual(resolveYoutubeAspect(SHORT_WITH_QUERY), { w: 9, h: 16 });
  });

  it("forma desconhecida ou não-YouTube → fallback 16:9 documentado", () => {
    assert.deepEqual(resolveYoutubeAspect(WATCH), { w: 16, h: 9 });
    assert.deepEqual(resolveYoutubeAspect(SHORT_LINK), { w: 16, h: 9 });
    assert.deepEqual(resolveYoutubeAspect(EMBED), { w: 16, h: 9 });
    assert.deepEqual(resolveYoutubeAspect(LIVE), { w: 16, h: 9 });
    assert.deepEqual(resolveYoutubeAspect("https://example.com/x"), { w: 16, h: 9 });
    assert.deepEqual(resolveYoutubeAspect(""), { w: 16, h: 9 });
  });

  it("devolve cópia (mutação não contamina o modelo nem o fallback)", () => {
    const a = resolveYoutubeAspect(LEGACY_SHORT);
    a.w = 999;
    assert.deepEqual(resolveYoutubeAspect(LEGACY_SHORT), { w: 9, h: 16 });
    const b = resolveYoutubeAspect(WATCH);
    b.h = 999;
    assert.deepEqual(FALLBACK_VIDEO_ASPECT, { w: 16, h: 9 });
  });
});

describe("VIDEO_PRESENTATION_ASPECT — modelo explícito de formatos", () => {
  it("portrait = 9:16, landscape = 16:9, square = 1:1", () => {
    assert.deepEqual(VIDEO_PRESENTATION_ASPECT.portrait, { w: 9, h: 16 });
    assert.deepEqual(VIDEO_PRESENTATION_ASPECT.landscape, { w: 16, h: 9 });
    assert.deepEqual(VIDEO_PRESENTATION_ASPECT.square, { w: 1, h: 1 });
  });

  it("portrait é mais alto que largo (formato Reel/Short)", () => {
    const { w, h } = VIDEO_PRESENTATION_ASPECT.portrait;
    assert.ok(h > w, `esperava h > w, veio ${w}×${h}`);
  });

  it("landscape é mais largo que alto (formato clássico)", () => {
    const { w, h } = VIDEO_PRESENTATION_ASPECT.landscape;
    assert.ok(w > h, `esperava w > h, veio ${w}×${h}`);
  });
});

describe("videoFrameStyle — fórmula única da moldura", () => {
  it("portrait: aspect-ratio 9 / 16 e largura com teto de altura", () => {
    const style = videoFrameStyle(VIDEO_PRESENTATION_ASPECT.portrait);
    assert.equal(style.aspectRatio, "9 / 16");
    assert.equal(
      style.width,
      "min(100%, calc(min(70vh, 640px) * 9 / 16))",
    );
  });

  it("landscape: aspect-ratio 16 / 9 (nada é forçado a 9:16)", () => {
    const style = videoFrameStyle(VIDEO_PRESENTATION_ASPECT.landscape);
    assert.equal(style.aspectRatio, "16 / 9");
    assert.equal(
      style.width,
      "min(100%, calc(min(70vh, 640px) * 16 / 9))",
    );
  });

  it("proporção exata de arquivo direto é preservada (1080×1920)", () => {
    const style = videoFrameStyle({ w: 1080, h: 1920 });
    assert.equal(style.aspectRatio, "1080 / 1920");
    // Altura derivada da largura: 640px de teto ⇒ 360px de largura (9:16).
    assert.equal(style.width, "min(100%, calc(min(70vh, 640px) * 1080 / 1920))");
  });

  it("fallback é exatamente o 16:9 de sempre", () => {
    assert.deepEqual(FALLBACK_VIDEO_ASPECT, { w: 16, h: 9 });
    const style = videoFrameStyle(FALLBACK_VIDEO_ASPECT);
    assert.equal(style.aspectRatio, "16 / 9");
    assert.equal(style.width, "min(100%, calc(min(70vh, 640px) * 16 / 9))");
  });

  it("a altura sempre deriva da proporção (largura × h/w ≤ 640px)", () => {
    for (const aspect of [
      VIDEO_PRESENTATION_ASPECT.portrait,
      VIDEO_PRESENTATION_ASPECT.landscape,
      VIDEO_PRESENTATION_ASPECT.square,
      { w: 1080, h: 1350 },
    ]) {
      const style = videoFrameStyle(aspect);
      // O teto de altura é compartilhado por todas as proporções.
      assert.match(style.width, /min\(70vh, 640px\) \* \d+ \/ \d+/);
      assert.equal(style.aspectRatio, `${aspect.w} / ${aspect.h}`);
    }
  });
});
