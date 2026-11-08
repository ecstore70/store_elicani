import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  findPageBlocksErrorKey,
  parsePageBlocksFormData,
  planPageBlocksReconcile,
  PAGE_BLOCK_MAX_ITEMS,
  type PageBlockInput,
} from "./page-blocks.ts";
import {
  parseRichInline,
  parseRichText,
} from "./rich-text.ts";

function formDataWith(value: string): FormData {
  const data = new FormData();
  data.set("page_blocks", value);
  return data;
}

describe("blocos de conteúdo — leitura do formulário", () => {
  it("campo ausente ou vazio devolve lista vazia", () => {
    assert.deepEqual(parsePageBlocksFormData(null), []);
    assert.deepEqual(parsePageBlocksFormData(""), []);
  });

  it("JSON inválido ou não-array devolve null", () => {
    assert.equal(parsePageBlocksFormData("{oops"), null);
    assert.equal(parsePageBlocksFormData('{"type":"text"}'), null);
    assert.equal(parsePageBlocksFormData("[1,2]"), null);
  });

  it("normaliza para o formato canônico e descarta campos desconhecidos", () => {
    const raw = JSON.stringify([
      {
        type: "text",
        content: "  Olá  ",
        key: "cliente-não-deve-viajar",
        hacker: "<script>alert(1)</script>",
      },
      { type: "image", media_url: "https://cdn.test/x.jpg", alt_text: "" },
    ]);
    const blocks = parsePageBlocksFormData(formDataWith(raw).get("page_blocks"));
    assert.ok(blocks);
    assert.equal(blocks.length, 2);
    assert.deepEqual(blocks[0], { type: "text", content: "Olá" });
    assert.deepEqual(blocks[1], {
      type: "image",
      media_url: "https://cdn.test/x.jpg",
    });
  });

  it("tipo desconhecido invalida a lista inteira", () => {
    const raw = JSON.stringify([{ type: "html", content: "<b>x</b>" }]);
    assert.equal(parsePageBlocksFormData(raw), null);
  });
});

describe("blocos de conteúdo — validação (servidor)", () => {
  const image: PageBlockInput = {
    type: "image",
    media_url: "https://cdn.test/promo.jpg",
  };

  it("lista válida não gera erro", () => {
    const blocks: PageBlockInput[] = [
      image,
      { type: "text", content: "## Título\n\nCorpo com **negrito**." },
      { type: "video", media_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
    ];
    assert.equal(findPageBlocksErrorKey(blocks), null);
    assert.equal(findPageBlocksErrorKey([]), null);
  });

  it("acima do limite devolve blocksTooMany", () => {
    const many = Array.from({ length: PAGE_BLOCK_MAX_ITEMS + 1 }, () => image);
    assert.equal(findPageBlocksErrorKey(many), "blocksTooMany");
  });

  it("texto exige conteúdo não vazio e dentro do limite", () => {
    assert.equal(findPageBlocksErrorKey([{ type: "text" }]), "blocksInvalid");
    assert.equal(
      findPageBlocksErrorKey([{ type: "text", content: "   " }]),
      "blocksInvalid",
    );
    assert.equal(
      findPageBlocksErrorKey([
        { type: "text", content: "x".repeat(10001) },
      ]),
      "blocksInvalid",
    );
  });

  it("imagem exige URL permitida e nunca aceita YouTube", () => {
    assert.equal(findPageBlocksErrorKey([{ type: "image" }]), "blocksInvalid");
    assert.equal(
      findPageBlocksErrorKey([
        { type: "image", media_url: "javascript:alert(1)" },
      ]),
      "blocksInvalid",
    );
    assert.equal(
      findPageBlocksErrorKey([
        {
          type: "image",
          media_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        },
      ]),
      "blocksInvalid",
    );
  });

  it("vídeo do YouTube precisa de ID válido; upload aceita URL comum", () => {
    assert.equal(
      findPageBlocksErrorKey([
        { type: "video", media_url: "https://www.youtube.com/watch?v=curto" },
      ]),
      "blocksInvalid",
    );
    assert.equal(
      findPageBlocksErrorKey([
        { type: "video", media_url: "https://cdn.test/aula.mp4" },
      ]),
      null,
    );
    assert.equal(
      findPageBlocksErrorKey([{ type: "video" }]),
      "blocksInvalid",
    );
  });

  it("legendas e alt dentro dos limites", () => {
    assert.equal(
      findPageBlocksErrorKey([
        { ...image, caption: "x".repeat(301) },
      ]),
      "blocksInvalid",
    );
    assert.equal(
      findPageBlocksErrorKey([{ ...image, alt_text: "x".repeat(201) }]),
      "blocksInvalid",
    );
  });
});

describe("blocos de conteúdo — reconciliação no servidor", () => {
  const existing = [
    { id: "a", media_url: "https://cdn.test/velha.jpg" },
    { id: "b", media_url: null },
  ];
  const next: PageBlockInput[] = [
    { type: "text", content: "Novo" },
    { type: "image", media_url: "https://cdn.test/nova.jpg" },
  ];

  it("inserta o conjunto novo e marca o antigo para delete", () => {
    const plan = planPageBlocksReconcile(existing, next);
    assert.deepEqual(plan.replaceIds, ["a", "b"]);
    assert.equal(plan.rows.length, 2);
    assert.deepEqual(
      plan.rows.map((row) => row.sort_order),
      [0, 1],
    );
  });

  it("só remove do storage a URL que SAIU e não é citada no novo conjunto", () => {
    const plan = planPageBlocksReconcile(existing, next);
    assert.deepEqual(plan.removeUrls, ["https://cdn.test/velha.jpg"]);
  });

  it("mantém a URL quando o bloco continua citando-a", () => {
    const plan = planPageBlocksReconcile(existing, [
      { type: "image", media_url: "https://cdn.test/velha.jpg" },
    ]);
    assert.deepEqual(plan.removeUrls, []);
  });

  it("campos seguem o tipo: texto só leva content; mídia só em image/video", () => {
    const plan = planPageBlocksReconcile([], [
      { type: "text", content: "Olá", media_url: "https://cdn.test/x" },
      { type: "image", media_url: "https://cdn.test/y.jpg", caption: "c" },
      { type: "video", media_url: "https://cdn.test/z.mp4", alt_text: "a" },
    ]);
    assert.equal(plan.rows[0].content, "Olá");
    assert.equal(plan.rows[0].media_url, null);
    assert.equal(plan.rows[1].media_url, "https://cdn.test/y.jpg");
    assert.equal(plan.rows[1].caption, "c");
    assert.equal(plan.rows[2].media_url, "https://cdn.test/z.mp4");
    assert.equal(plan.rows[2].caption, null);
    assert.equal(plan.rows[2].alt_text, null);
  });
});

describe("rich text — subconjunto seguro", () => {
  it("títulos, parágrafos, listas e formatação inline", () => {
    const blocks = parseRichText(
      "## Por que escolher\n\nA Luva foi desenvolvida com **couro** e *nylon*.\n\n- Casca rígida\n- Impermeável\n\n1. Primeiro\n2. Segundo",
    );
    assert.equal(blocks.length, 4);
    assert.deepEqual(blocks[0], {
      kind: "heading",
      level: 3,
      children: [{ kind: "text", text: "Por que escolher" }],
    });
    assert.equal(blocks[1].kind, "paragraph");
    assert.equal(blocks[2].kind, "list");
    assert.equal(blocks[2].kind === "list" && blocks[2].ordered, false);
    assert.equal(blocks[3].kind === "list" && blocks[3].ordered, true);
  });

  it("`###` vira h4 e marcação desconhecida fica literal", () => {
    const blocks = parseRichText("### Detalhes\n\n<script>alert(1)</script>");
    assert.equal(blocks[0].kind === "heading" && blocks[0].level, 4);
    // HTML nunca é interpretado: o texto aparece como está (o React escapa).
    const paragraph = blocks[1];
    assert.equal(paragraph.kind, "paragraph");
    const text =
      paragraph.kind === "paragraph"
        ? paragraph.children.map((n) => (n.kind === "text" ? n.text : "")).join("")
        : "";
    assert.ok(text.includes("<script>alert(1)</script>"));
  });

  it("links aceitam https e caminho do site; javascript: vira texto", () => {
    const inline = parseRichInline(
      "Veja [aqui](https://loja.test/p) e [mais](/termos) e [bom](javascript:alert(1))",
    );
    const links = inline.filter((n) => n.kind === "link");
    assert.equal(links.length, 2);
    assert.equal(links[0].kind === "link" && links[0].href, "https://loja.test/p");
    assert.equal(links[1].kind === "link" && links[1].href, "/termos");
    // O link proibido vira texto literal (nó text no lugar dele).
    assert.ok(inline.some((n) => n.kind === "text" && n.text.includes("javascript:")));
  });

  it("negrito e itálico aninhados e conteúdo vazio", () => {
    const inline = parseRichInline("**forte e *fraco* ok**");
    assert.equal(inline[0].kind, "bold");
    assert.deepEqual(parseRichText("   \n\n  "), []);
  });

  it("listas com marcador misturado não vazam para o parágrafo", () => {
    const blocks = parseRichText("- um\n- dois\n\ntexto solto");
    assert.equal(blocks.length, 2);
    assert.equal(blocks[0].kind === "list" && blocks[0].items.length, 2);
    assert.equal(blocks[1].kind, "paragraph");
  });
});
