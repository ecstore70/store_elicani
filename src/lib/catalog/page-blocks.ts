import {
  extractYouTubeId,
  isAllowedMediaUrl,
  isYouTubeUrl,
  MEDIA_URL_MAX_LENGTH,
} from "./media.ts";
import type { Translator } from "@/lib/i18n/translate.ts";

/**
 * Blocos de conteúdo da página do produto — PURO (sem servidor nem cliente).
 *
 * Regras de domínio:
 *   • bloco = { type: "image" | "text" | "video", … } — a sequência é a que
 *     o comerciante montou (sort_order = índice no array do formulário);
 *   • IMAGEM: URL de mídia permitida, NUNCA do YouTube;
 *   • VÍDEO: URL de mídia permitida; URL do YouTube precisa de ID válido —
 *     o embed é montado por nós (youtube-nocookie), nunca HTML do lojista;
 *   • TEXTO: subconjunto seguro de formatação (ver rich-text.ts) — nunca
 *     HTML cru, script, CSS ou iframe;
 *   • o conteúdo é OPCIONAL: produto sem blocos = página como sempre.
 *
 * O JSON trafega no campo oculto `page_blocks` (igual ao `media` da galeria)
 * e o servidor é sempre a autoridade na validação.
 */

export const PAGE_BLOCK_MAX_ITEMS = 30;
export const PAGE_BLOCK_CONTENT_MAX_LENGTH = 10000;
export const PAGE_BLOCK_CAPTION_MAX_LENGTH = 300;
export const PAGE_BLOCK_ALT_MAX_LENGTH = 200;
export const PAGE_BLOCK_URL_MAX_LENGTH = MEDIA_URL_MAX_LENGTH;

export type PageBlockType = "image" | "text" | "video";

/** Bloco como trafegado no formulário (hidden input JSON). */
export type PageBlockInput = {
  /** Id da linha existente (edição); ausente = bloco novo. */
  id?: string;
  type: PageBlockType;
  /** Bloco de texto (subconjunto seguro de rich text). */
  content?: string;
  /** Bloco de imagem/vídeo (upload próprio ou URL canônica do YouTube). */
  media_url?: string;
  caption?: string;
  alt_text?: string;
};

/** Linha existente de `product_page_blocks` considerada pela reconciliação. */
export type ExistingPageBlockRow = { id: string; media_url: string | null };

export type PageBlocksPlan = {
  /** IDs do conjunto antigo — removidos APÓS o insert do novo conjunto. */
  replaceIds: string[];
  /** URLs de mídia que saíram — candidatas à limpeza do storage. */
  removeUrls: string[];
  /** Novo conjunto canônico, em ordem de exibição. */
  rows: {
    type: PageBlockType;
    content: string | null;
    media_url: string | null;
    caption: string | null;
    alt_text: string | null;
    sort_order: number;
  }[];
};

/** String opcional: trim + vazio vira `undefined` (nulo no banco). */
function optionalText(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const value = raw.trim();
  return value.length > 0 ? value : undefined;
}

/**
 * Normaliza os blocos lidos do FormData (JSON) para o formato canônico.
 * Devolve `null` quando o JSON é inválido (não-array, elemento não-objeto,
 * tipo desconhecido) — a action traduz como `blocksInvalid`.
 */
export function parsePageBlocksFormData(
  raw: FormDataEntryValue | null,
): PageBlockInput[] | null {
  if (typeof raw !== "string" || raw.trim().length === 0) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!Array.isArray(parsed)) return null;

  const blocks: PageBlockInput[] = [];
  for (const entry of parsed) {
    if (entry === null || typeof entry !== "object" || Array.isArray(entry)) {
      return null;
    }
    const record = entry as Record<string, unknown>;
    const type = record.type;
    if (type !== "image" && type !== "text" && type !== "video") return null;

    const block: PageBlockInput = { type };
    const id = optionalText(record.id);
    if (id) block.id = id;
    const content = optionalText(record.content);
    if (content) block.content = content;
    const mediaUrl = optionalText(record.media_url);
    if (mediaUrl) block.media_url = mediaUrl;
    const caption = optionalText(record.caption);
    if (caption) block.caption = caption;
    const altText = optionalText(record.alt_text);
    if (altText) block.alt_text = altText;
    blocks.push(block);
  }
  return blocks;
}

/**
 * Valida a lista completa de blocos (servidor). Devolve a chave da mensagem
 * de erro ou `null` quando válida.
 */
export function findPageBlocksErrorKey(
  blocks: PageBlockInput[],
): "blocksTooMany" | "blocksInvalid" | null {
  if (blocks.length > PAGE_BLOCK_MAX_ITEMS) return "blocksTooMany";

  for (const block of blocks) {
    if (block.type !== "image" && block.type !== "text" && block.type !== "video") {
      return "blocksInvalid";
    }
    if (
      (block.caption?.length ?? 0) > PAGE_BLOCK_CAPTION_MAX_LENGTH ||
      (block.alt_text?.length ?? 0) > PAGE_BLOCK_ALT_MAX_LENGTH
    ) {
      return "blocksInvalid";
    }

    if (block.type === "text") {
      const content = (block.content ?? "").trim();
      if (content.length === 0 || content.length > PAGE_BLOCK_CONTENT_MAX_LENGTH) {
        return "blocksInvalid";
      }
      continue;
    }

    const url = block.media_url ?? "";
    if (!isAllowedMediaUrl(url)) return "blocksInvalid";
    if (url.length > PAGE_BLOCK_URL_MAX_LENGTH) return "blocksInvalid";

    if (isYouTubeUrl(url)) {
      // Imagem nunca é vídeo do YouTube; vídeo precisa de ID válido.
      if (block.type !== "video" || !extractYouTubeId(url)) return "blocksInvalid";
    }
  }
  return null;
}

/** Erro de domínio → mensagem traduzida (usado pelas actions). */
export function pageBlocksErrorMessage(
  key: "blocksTooMany" | "blocksInvalid",
  t: Translator,
): string {
  return t(
    key === "blocksTooMany"
      ? "products.error.blocksTooMany"
      : "products.error.blocksInvalid",
  );
}

/**
 * Plano de reconciliação dos blocos no servidor — mesma ordem e mesmo
 * contrato de `planMediaReconcile`: insert do novo conjunto primeiro, delete
 * do antigo depois (se o insert falhar, nada se perde; se o delete falhar,
 * a próxima tentativa recalculado converge).
 */
export function planPageBlocksReconcile(
  existing: ExistingPageBlockRow[],
  blocks: PageBlockInput[],
): PageBlocksPlan {
  const nextUrls = new Set(
    blocks
      .map((block) => block.media_url)
      .filter((url): url is string => typeof url === "string" && url.length > 0),
  );
  return {
    replaceIds: existing.map((row) => row.id),
    removeUrls: existing
      .map((row) => row.media_url)
      .filter(
        (url): url is string => typeof url === "string" && !nextUrls.has(url),
      ),
    rows: blocks.map((block, index) => ({
      type: block.type,
      content: block.type === "text" ? (block.content ?? null) : null,
      media_url: block.type === "text" ? null : (block.media_url ?? null),
      caption: block.type === "image" ? (block.caption ?? null) : null,
      alt_text: block.type === "image" ? (block.alt_text ?? null) : null,
      sort_order: index,
    })),
  };
}
