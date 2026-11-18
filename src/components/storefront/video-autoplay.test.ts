import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

/**
 * Contrato de AUTOPLAY da vitrine — lê as fontes dos componentes (o runner
 * não parseia JSX) para garantir, como regressão, que:
 *
 *   • o `<video>` nativo declara autoplay+muted+playsInline no HTML (não só
 *     `play()` via JS), preservando observer de viewport e botão de som;
 *   • o player de YouTube do bloco nasce com autoplay+mute (sem interação)
 *     e permissão `allow="autoplay"` no iframe;
 *   • nada muda na moldura/dinâmica de proporção nem na galeria.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url));

function read(name: string): string {
  return readFileSync(path.join(HERE, name), "utf8");
}

/** Extrai o elemento JSX de abertura (ignora menções em comentários). */
function element(source: string, openTag: string): string {
  const tag = openTag.replace(/^</, "");
  const match = new RegExp(`<${tag}\\s`).exec(source);
  assert.ok(match, `tag <${tag}> não encontrada`);
  const start = match.index;
  const end = source.indexOf("/>", start);
  assert.notEqual(end, -1, `fecho de <${tag}> não encontrado`);
  return source.slice(start, end + 2);
}

describe("autoplay — vídeo nativo (ContentVideo)", () => {
  const src = read("content-video.tsx");

  it("<video> declara autoplay + muted + playsInline (intenção sem JS)", () => {
    const tag = element(src, "<video");
    assert.match(tag, /\bautoPlay\b/, "falta o atributo autoPlay");
    assert.match(tag, /\bmuted=\{muted\}/, "falta muted");
    assert.match(tag, /\bplaysInline\b/, "falta playsInline");
    assert.match(tag, /preload="metadata"/, "preload preservado");
  });

  it("observer de viewport preservado (entra → toca, sai → pausa)", () => {
    assert.match(src, /new IntersectionObserver\(/);
    assert.match(src, /\.play\(\)\.catch\(/);
    assert.match(src, /video\.pause\(\)/);
  });

  it("controle de som preservado e som inicial desligado", () => {
    assert.match(src, /useState\(true\)/, "muted inicial = true");
    assert.match(src, /function toggleSound|const toggleSound/);
    assert.match(src, /VolumeX/, "ícone de mudo continua presente");
  });

  it("moldura/layout intactos (videoFrameStyle, object-fit, sem classe fixa)", () => {
    assert.match(src, /videoFrameStyle\(aspect \?\? FALLBACK_VIDEO_ASPECT\)/);
    assert.match(src, /object-contain/);
    assert.ok(!src.includes("aspect-video"), "nenhuma classe 16:9 fixa");
    assert.ok(!src.includes("aspect-square"), "nenhuma classe 1:1 fixa");
  });
});

describe("autoplay — player de YouTube do bloco de conteúdo", () => {
  const src = read("page-content.tsx");

  it("embed nasce com autoplay=1&mute=1 (mudo, sem interação)", () => {
    const iframe = element(src, "<iframe");
    assert.match(
      iframe,
      /youtubeEmbedUrl\(youtubeId, true\)/,
      "o embed precisa de autoplay=true",
    );
    assert.ok(
      !iframe.includes("youtubeEmbedUrl(youtubeId, false)"),
      "autoplay desligado voltou ao iframe",
    );
  });

  it("iframe recebe permissão allow=\"autoplay;…\"", () => {
    const iframe = element(src, "<iframe");
    assert.match(iframe, /allow="autoplay; encrypted-media; picture-in-picture"/);
    assert.match(iframe, /allowFullScreen/);
  });

  it("moldura dinâmica de proporção intacta (9:16 continua vindo da fonte)", () => {
    assert.match(
      src,
      /videoFrameStyle\(resolveYoutubeAspect\(block\.media_url \?\? ""\)\)/,
    );
    const iframe = element(src, "<iframe");
    assert.match(iframe, /className="absolute inset-0 h-full w-full border-0"/);
    // `aspect-video` só pode existir UMA vez: no placeholder vazio (bloco
    // sem fonte → fallback 16:9 documentado) — nunca na moldura do player.
    const occurrences = src.split("aspect-video").length - 1;
    assert.equal(occurrences, 1, `aspect-video aparece ${occurrences}×`);
    const at = src.indexOf("aspect-video");
    assert.ok(at > src.indexOf("function MediaPlaceholder"), "fora do placeholder");
    assert.ok(at < src.indexOf("function Block"), "fora do placeholder");
  });

  it("fonte do vídeo continua montada por nós (youtube-nocookie + ID validado)", () => {
    assert.match(src, /youtubeEmbedUrl\(youtubeId, true\)/);
    assert.match(src, /extractYouTubeId\(block\.media_url\)/);
  });
});

describe("autoplay — galeria de produto não regrediu", () => {
  const src = read("product-gallery.tsx");

  it("vídeo nativo da galeria mantém autoPlay + muted + playsInline", () => {
    const tag = element(src, "<video");
    assert.match(tag, /autoPlay=\{allowAuto\}/);
    assert.match(tag, /\bmuted\b/);
    assert.match(tag, /playsInline/);
  });

  it("YouTube da galeria mantém embed com autoplay condicional + allow", () => {
    assert.match(
      src,
      /youtubeEmbedUrl\(youtubeId, allowAuto && !videoStarted\)/,
    );
    assert.match(src, /allow="autoplay; encrypted-media; picture-in-picture"/);
  });

  it("reduzir-movimento/Save-Data continuam governando o autoplay da galeria", () => {
    assert.match(src, /prefers-reduced-motion/);
    assert.match(src, /saveData/);
  });
});
