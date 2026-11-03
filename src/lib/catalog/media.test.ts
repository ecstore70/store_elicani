import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createTranslator } from "../i18n/translate.ts";
import {
  canonicalYouTubeUrl,
  extractYouTubeId,
  findMediaErrorKey,
  isAllowedMediaUrl,
  isYouTubeUrl,
  mediaErrorMessage,
  MEDIA_MAX_ITEMS,
  parseMediaFormData,
  youtubeEmbedUrl,
  type MediaItemInput,
} from "./media.ts";

const t = createTranslator("en");

describe("extração de ID do YouTube", () => {
  it("aceita watch?v=, youtu.be, embed, shorts e live", () => {
    assert.equal(
      extractYouTubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
      "dQw4w9WgXcQ",
    );
    assert.equal(
      extractYouTubeId("https://youtu.be/dQw4w9WgXcQ?si=abc"),
      "dQw4w9WgXcQ",
    );
    assert.equal(
      extractYouTubeId("https://m.youtube.com/watch?v=dQw4w9WgXcQ&t=42"),
      "dQw4w9WgXcQ",
    );
    assert.equal(
      extractYouTubeId("https://www.youtube.com/embed/dQw4w9WgXcQ"),
      "dQw4w9WgXcQ",
    );
    assert.equal(
      extractYouTubeId("https://www.youtube.com/shorts/dQw4w9WgXcQ"),
      "dQw4w9WgXcQ",
    );
    assert.equal(
      extractYouTubeId("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"),
      "dQw4w9WgXcQ",
    );
    assert.equal(extractYouTubeId("http://youtube.com/watch?v=dQw4w9WgXcQ"), "dQw4w9WgXcQ");
  });

  it("rejeita URLs inválidas, hosts estranhos e IDs curtos", () => {
    assert.equal(extractYouTubeId("not a url"), null);
    assert.equal(extractYouTubeId("https://evil.example/watch?v=dQw4w9WgXcQ"), null);
    assert.equal(extractYouTubeId("https://www.youtube.com/watch?v=short"), null);
    assert.equal(extractYouTubeId("https://www.youtube.com/playlist?list=PL123"), null);
    assert.equal(extractYouTubeId("https://youtu.be/"), null);
    assert.equal(extractYouTubeId("javascript:alert(1)"), null);
    // URL do YouTube com parâmetro extra não quebra a extração.
    assert.equal(
      extractYouTubeId("https://www.youtube.com/watch?list=PL1&v=dQw4w9WgXcQ"),
      "dQw4w9WgXcQ",
    );
  });

  it("isYouTubeUrl detecta hosts do YouTube (mesmo sem ID válido)", () => {
    assert.equal(isYouTubeUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ"), true);
    assert.equal(isYouTubeUrl("https://youtu.be/dQw4w9WgXcQ"), true);
    assert.equal(isYouTubeUrl("https://evil.example/watch?v=dQw4w9WgXcQ"), false);
    assert.equal(isYouTubeUrl("https://i.ytimg.com/vi/x/hq.jpg"), false);
    assert.equal(isYouTubeUrl("nonsense"), false);
  });

  it("constrói URL canônica e embed youtube-nocookie", () => {
    assert.equal(
      canonicalYouTubeUrl("dQw4w9WgXcQ"),
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    );
    const embed = youtubeEmbedUrl("dQw4w9WgXcQ", true);
    assert.ok(embed.startsWith("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?"));
    assert.ok(embed.includes("autoplay=1"));
    assert.ok(embed.includes("mute=1"));
    assert.ok(embed.includes("playsinline=1"));
    const quiet = youtubeEmbedUrl("dQw4w9WgXcQ", false);
    assert.ok(!quiet.includes("autoplay=1"));
  });
});

describe("validação de URLs de mídia", () => {
  it("aceita https:// e caminhos do site", () => {
    assert.equal(isAllowedMediaUrl("https://cdn.exemplo.com/a.jpg"), true);
    assert.equal(isAllowedMediaUrl("/uploads/a.jpg"), true);
    assert.equal(isAllowedMediaUrl("https://storage.supabase.co/object/x.mp4"), true);
  });

  it("rejeita vazio, longos e esquemas perigosos", () => {
    assert.equal(isAllowedMediaUrl(""), false);
    assert.equal(isAllowedMediaUrl("   "), false);
    assert.equal(isAllowedMediaUrl(`https://a.com/${"x".repeat(3000)}`), false);
    assert.equal(isAllowedMediaUrl("javascript:alert(1)"), false);
    assert.equal(isAllowedMediaUrl("data:text/html,<script>"), false);
    assert.equal(isAllowedMediaUrl("ftp://a.com/x.jpg"), false);
  });
});

describe("validação da lista de mídia", () => {
  const image = (url: string): MediaItemInput => ({ type: "image", url });
  const video = (url: string): MediaItemInput => ({ type: "video", url });

  it("aceita lista vazia e lista válida (imagens + vídeo próprio + YouTube)", () => {
    assert.equal(findMediaErrorKey([]), null);
    assert.equal(
      findMediaErrorKey([
        image("https://a.com/1.jpg"),
        video("https://storage.supabase.co/object/product-media/1.mp4"),
        video("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
      ]),
      null,
    );
  });

  it("rejeita mais de MEDIA_MAX_ITEMS", () => {
    const items = Array.from({ length: MEDIA_MAX_ITEMS + 1 }, (_, i) =>
      image(`https://a.com/${i}.jpg`),
    );
    assert.equal(findMediaErrorKey(items), "mediaTooMany");
  });

  it("rejeita tipo desconhecido e URL inválida", () => {
    assert.equal(
      findMediaErrorKey([{ type: "gif" as "image", url: "https://a.com/x" }]),
      "mediaInvalid",
    );
    assert.equal(findMediaErrorKey([image("javascript:alert(1)")]), "mediaInvalid");
  });

  it("exige ID válido em URLs do YouTube (bloqueia embeds arbitrários)", () => {
    // ID inválido → rejeita.
    assert.equal(
      findMediaErrorKey([video("https://www.youtube.com/embed/NOPE")]),
      "mediaInvalid",
    );
    // YouTube como imagem → rejeita (YouTube é vídeo).
    assert.equal(
      findMediaErrorKey([image("https://www.youtube.com/watch?v=dQw4w9WgXcQ")]),
      "mediaInvalid",
    );
    // iframe/html nunca passa.
    assert.equal(
      findMediaErrorKey([video("<iframe src='https://youtube.com/embed/x'></iframe>")]),
      "mediaInvalid",
    );
    // Válido → aceita.
    assert.equal(
      findMediaErrorKey([video("https://youtu.be/dQw4w9WgXcQ")]),
      null,
    );
  });

  it("mensagem de erro usa as chaves de produto", () => {
    assert.equal(mediaErrorMessage("mediaTooMany", t), t("products.error.mediaTooMany"));
    assert.equal(mediaErrorMessage("mediaInvalid", t), t("products.error.mediaInvalid"));
  });
});

describe("parse do FormData", () => {
  it("devolve [] para vazio e lista canônica para JSON válido", () => {
    assert.deepEqual(parseMediaFormData(null), []);
    assert.deepEqual(parseMediaFormData(""), []);
    const parsed = parseMediaFormData(
      JSON.stringify([
        { id: "a1", type: "image", url: " https://a.com/1.jpg " },
        { type: "video", url: "https://youtu.be/dQw4w9WgXcQ" },
      ]),
    );
    assert.deepEqual(parsed, [
      { id: "a1", type: "image", url: "https://a.com/1.jpg" },
      { type: "video", url: "https://youtu.be/dQw4w9WgXcQ" },
    ]);
  });

  it("devolve null para JSON malformado ou item inválido", () => {
    assert.equal(parseMediaFormData("{nope"), null);
    assert.equal(parseMediaFormData(JSON.stringify({ type: "image" })), null);
    assert.equal(
      parseMediaFormData(JSON.stringify([{ type: "svg", url: "https://a.com/x" }])),
      null,
    );
    assert.equal(parseMediaFormData(JSON.stringify([{ type: "image", url: 5 }])), null);
  });
});
