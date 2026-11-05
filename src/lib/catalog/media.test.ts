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
  mediaStoragePath,
  parseMediaFormData,
  planMediaReconcile,
  primaryImageUrl,
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

describe("reconciliação da galeria", () => {
  const existing = [
    { id: "row-1", source_url: "https://cdn.test/a.jpg" },
    { id: "row-2", source_url: "https://cdn.test/b.jpg" },
  ];

  it("ordena o novo conjunto e marca os ids antigos para troca", () => {
    const plan = planMediaReconcile(existing, [
      { type: "image", url: "https://cdn.test/b.jpg" },
      { type: "video", url: "https://youtu.be/dQw4w9WgXcQ" },
      { type: "image", url: "https://cdn.test/new.jpg" },
    ]);
    assert.deepEqual(plan.replaceIds, ["row-1", "row-2"]);
    assert.deepEqual(
      plan.rows.map((row) => row.display_order),
      [0, 1, 2],
    );
    // Só o que saiu da lista vira candidato a limpeza do storage.
    assert.deepEqual(plan.removeUrls, ["https://cdn.test/a.jpg"]);
  });

  it("não remove storage quando nada saiu e aceita lista vazia", () => {
    const plan = planMediaReconcile(existing, [
      { type: "image", url: "https://cdn.test/a.jpg" },
      { type: "image", url: "https://cdn.test/b.jpg" },
    ]);
    assert.deepEqual(plan.removeUrls, []);

    const cleared = planMediaReconcile(existing, []);
    assert.deepEqual(cleared.rows, []);
    assert.deepEqual(cleared.removeUrls, [
      "https://cdn.test/a.jpg",
      "https://cdn.test/b.jpg",
    ]);
    assert.deepEqual(cleared.replaceIds, ["row-1", "row-2"]);
  });

  it("devolve a primeira imagem como primária; null sem imagens", () => {
    assert.equal(
      primaryImageUrl([
        { type: "video", url: "https://youtu.be/dQw4w9WgXcQ" },
        { type: "image", url: "https://cdn.test/first.jpg" },
        { type: "image", url: "https://cdn.test/second.jpg" },
      ]),
      "https://cdn.test/first.jpg",
    );
    assert.equal(
      primaryImageUrl([{ type: "video", url: "https://youtu.be/dQw4w9WgXcQ" }]),
      null,
    );
    assert.equal(primaryImageUrl([]), null);
  });
});

describe("caminho de storage a partir da URL pública", () => {
  const base = "https://abc.supabase.co";

  it("extrai o path dentro do bucket product-media", () => {
    assert.equal(
      mediaStoragePath(
        "https://abc.supabase.co/storage/v1/object/public/product-media/s1/uuid.png",
        base,
      ),
      "s1/uuid.png",
    );
  });

  it("devolve null para outras bases, buckets ou URL inválida", () => {
    assert.equal(
      mediaStoragePath("https://other.co/storage/v1/object/public/product-media/s1/a.png", base),
      null,
    );
    assert.equal(
      mediaStoragePath("https://abc.supabase.co/storage/v1/object/public/logos/s1/a.png", base),
      null,
    );
    assert.equal(mediaStoragePath("https://cdn.test/a.jpg", base), null);
    assert.equal(
      mediaStoragePath(`${base}/storage/v1/object/public/product-media/`, base),
      null,
    );
  });
});
