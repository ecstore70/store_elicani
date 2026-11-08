/**
 * Rich text SEGURO dos blocos de conteúdo — PURO (sem servidor nem cliente).
 *
 * Subconjunto controlado do Markdown (nunca HTML cru):
 *   • `## texto`  → subtítulo (h3)   • `### texto` → título menor (h4)
 *   • linha em branco separa parágrafos
 *   • `**negrito**`  • `*itálico*`
 *   • `- item` (lista)  • `1. item` (lista numerada)
 *   • `[texto](https://…)` ou `[texto](/caminho)` → link
 *
 * Fora do subconjunto o texto é LITERAL: qualquer marcação desconhecida
 * (inclusive `<script>`, HTML, CSS) aparece como texto simples — o parser
 * nunca interpreta HTML e o renderer usa nós React (o React escapa o
 * texto), portanto não há superfície de XSS. Links fora da política
 * http(s)/caminho-do-site viram texto literal.
 */

export type RichInline =
  | { kind: "text"; text: string }
  | { kind: "bold"; children: RichInline[] }
  | { kind: "italic"; children: RichInline[] }
  | { kind: "link"; href: string; text: string };

export type RichBlock =
  | { kind: "heading"; level: 3 | 4; children: RichInline[] }
  | { kind: "paragraph"; children: RichInline[] }
  | { kind: "list"; ordered: boolean; items: RichInline[][] };

/** Mesma política de URL de mídia: https://… ou caminho do site /… . */
const ALLOWED_HREF = /^(https?:\/\/|\/)/i;
const HEADING = /^(#{2,4})\s+(.*)$/;
const UNORDERED_ITEM = /^[-*]\s+(.*)$/;
const ORDERED_ITEM = /^\d+[.)]\s+(.*)$/;

/**
 * Token de formatação inline: **negrito**, *itálico* ou [link](url).
 * Negrito usa `[\s\S]+?` para aceitar itálico aninhado (`**a *b* c**`);
 * o itálico fica de fora do asterisco (não atravessa `*`).
 */
const INLINE_TOKEN =
  /(\*\*[\s\S]+?\*\*|\*[^*\n]+\*|\[[^\]\n]+\]\([^)\s]+\))/;

function safeHref(raw: string): string | null {
  const href = raw.trim();
  return ALLOWED_HREF.test(href) && href.length <= 2048 ? href : null;
}

/** Analisa o texto de um trecho em nós inline (recursivo nos filhos). */
export function parseRichInline(text: string): RichInline[] {
  const nodes: RichInline[] = [];
  let rest = text;

  while (rest.length > 0) {
    const match = rest.match(INLINE_TOKEN);
    if (!match || match.index === undefined) {
      nodes.push({ kind: "text", text: rest });
      break;
    }

    if (match.index > 0) {
      nodes.push({ kind: "text", text: rest.slice(0, match.index) });
    }

    const token = match[0];
    if (token.startsWith("**")) {
      nodes.push({
        kind: "bold",
        children: parseRichInline(token.slice(2, -2)),
      });
    } else if (token.startsWith("*")) {
      nodes.push({
        kind: "italic",
        children: parseRichInline(token.slice(1, -1)),
      });
    } else {
      const split = token.lastIndexOf("](");
      const label = token.slice(1, split);
      const href = safeHref(token.slice(split + 2, -1));
      if (href) {
        nodes.push({ kind: "link", href, text: label });
      } else {
        nodes.push({ kind: "text", text: token });
      }
    }

    rest = rest.slice(match.index + token.length);
  }

  return nodes;
}

/**
 * Analisa o conteúdo de um bloco de texto na estrutura de blocos.
 * Conteúdo só com espaços/quebras devolve `[]`.
 */
export function parseRichText(raw: string): RichBlock[] {
  const lines = raw.replace(/\r\n?/g, "\n").split("\n");
  const blocks: RichBlock[] = [];

  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  function flushParagraph() {
    if (paragraph.length === 0) return;
    const text = paragraph.join(" ").trim();
    paragraph = [];
    if (text.length > 0) {
      blocks.push({ kind: "paragraph", children: parseRichInline(text) });
    }
  }

  function flushList() {
    if (list === null) return;
    const { ordered, items } = list;
    list = null;
    if (items.length > 0) {
      blocks.push({
        kind: "list",
        ordered,
        items: items.map((item) => parseRichInline(item)),
      });
    }
  }

  function flushAll() {
    flushParagraph();
    flushList();
  }

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.length === 0) {
      flushAll();
      continue;
    }

    const heading = trimmed.match(HEADING);
    if (heading) {
      flushAll();
      // `##` → h3, `###`/`####` → h4 (a página já usa h1/h2 nos títulos).
      const level: 3 | 4 = heading[1].length >= 3 ? 4 : 3;
      const text = heading[2].trim();
      if (text.length > 0) {
        blocks.push({
          kind: "heading",
          level,
          children: parseRichInline(text),
        });
      }
      continue;
    }

    const unordered = trimmed.match(UNORDERED_ITEM);
    if (unordered) {
      flushParagraph();
      if (list && !list.ordered) {
        list.items.push(unordered[1]);
      } else {
        flushList();
        list = { ordered: false, items: [unordered[1]] };
      }
      continue;
    }

    const ordered = trimmed.match(ORDERED_ITEM);
    if (ordered) {
      flushParagraph();
      if (list && list.ordered) {
        list.items.push(ordered[1]);
      } else {
        flushList();
        list = { ordered: true, items: [ordered[1]] };
      }
      continue;
    }

    flushList();
    paragraph.push(trimmed);
  }

  flushAll();
  return blocks;
}
