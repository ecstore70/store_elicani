import type { Translator } from "@/lib/i18n/translate.ts";

/**
 * Galeria de mídia de produto — PURO (sem servidor nem cliente).
 *
 * Regras de domínio:
 *   • item = { type: "image" | "video", url } — a PRIMEIRA imagem da lista
 *     é a primária (espelhada em products.image_url ao salvar);
 *   • vídeos do YouTube são validados aqui (ID extraído com segurança) —
 *     o embed usa exclusivamente youtube-nocookie montado POR NÓS; nenhum
 *     HTML/iframe do comerciante é aceito;
 *   • URLs aceitas: https://… ou caminho do site /… (mesma política do
 *     campo image_url legado — bloqueia javascript:, data:, etc.).
 */

export const MEDIA_MAX_ITEMS = 64;
export const MEDIA_URL_MAX_LENGTH = 2048;
export const IMAGE_MAX_BYTES = 10 * 1024 * 1024; // 10 MB
export const VIDEO_MAX_BYTES = 100 * 1024 * 1024; // 100 MB
export const MEDIA_BUCKET = "product-media";

export const IMAGE_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
] as const;

export const VIDEO_MIME_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
] as const;

export type MediaType = "image" | "video";

/** Item de galeria como trafegado no formulário (hidden input JSON). */
export type MediaItemInput = {
  /** Id da linha existente (edição); ausente = item novo. */
  id?: string;
  type: MediaType;
  url: string;
};

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
  "youtu.be",
  "www.youtu.be",
]);

/**
 * Extrai o ID de um vídeo do YouTube a partir de URLs suportadas:
 * watch?v=, youtu.be/, /embed/, /shorts/, /live/, /v/.
 * Devolve `null` quando não é uma URL do YouTube válida.
 */
export function extractYouTubeId(rawUrl: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
  if (!YOUTUBE_HOSTS.has(parsed.hostname.toLowerCase())) return null;

  const host = parsed.hostname.toLowerCase();
  if (host === "youtu.be" || host === "www.youtu.be") {
    const id = parsed.pathname.split("/").filter(Boolean)[0] ?? "";
    return YOUTUBE_ID.test(id) ? id : null;
  }

  if (parsed.pathname === "/watch") {
    const id = parsed.searchParams.get("v") ?? "";
    return YOUTUBE_ID.test(id) ? id : null;
  }

  const match = parsed.pathname.match(
    /^\/(?:embed|shorts|live|v)\/([A-Za-z0-9_-]{11})(?:\/|$)/,
  );
  return match ? match[1] : null;
}

/** É uma URL do YouTube (com ID válido ou não)? */
export function isYouTubeUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
    return YOUTUBE_HOSTS.has(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
}

/** URL canônica para armazenar itens do YouTube (id extraído). */
export function canonicalYouTubeUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`;
}

/** URL canônica do player (privacidade) para embed. */
export function youtubeEmbedUrl(id: string, autoplay: boolean): string {
  const params = new URLSearchParams({
    rel: "0",
    playsinline: "1",
  });
  if (autoplay) {
    params.set("autoplay", "1");
    params.set("mute", "1");
  }
  return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`;
}

/** Mesma política do campo image_url: https://… ou /caminho-do-site. */
export function isAllowedMediaUrl(rawUrl: string): boolean {
  const url = rawUrl.trim();
  return (
    url.length > 0 &&
    url.length <= MEDIA_URL_MAX_LENGTH &&
    /^(https?:\/\/|\/)/i.test(url)
  );
}

/**
 * Valida a lista de mídia completa (servidor). Devolve a chave de mensagem
 * do erro ou `null` quando válida.
 */
export function findMediaErrorKey(
  items: MediaItemInput[],
): "mediaTooMany" | "mediaInvalid" | null {
  if (items.length > MEDIA_MAX_ITEMS) return "mediaTooMany";

  for (const item of items) {
    if (item.type !== "image" && item.type !== "video") return "mediaInvalid";
    if (!isAllowedMediaUrl(item.url)) return "mediaInvalid";

    // URL com cara de YouTube → precisa de ID válido (senão, rejeita).
    if (isYouTubeUrl(item.url)) {
      if (item.type !== "video" || !extractYouTubeId(item.url)) {
        return "mediaInvalid";
      }
    }
  }
  return null;
}

/** Erro de domínio → mensagem traduzida (usado pelas actions). */
export function mediaErrorMessage(
  key: "mediaTooMany" | "mediaInvalid",
  t: Translator,
): string {
  return t(
    key === "mediaTooMany"
      ? "products.error.mediaTooMany"
      : "products.error.mediaInvalid",
  );
}

/** Normaliza os itens lidos do FormData (JSON) para o formato canônico. */
export function parseMediaFormData(raw: FormDataEntryValue | null): MediaItemInput[] | null {
  if (typeof raw !== "string" || raw.trim() === "") return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const items: MediaItemInput[] = [];
    for (const entry of parsed) {
      if (typeof entry !== "object" || entry === null) return null;
      const record = entry as Record<string, unknown>;
      const type = record.type;
      const url = record.url;
      if ((type !== "image" && type !== "video") || typeof url !== "string") {
        return null;
      }
      const id = record.id;
      items.push({
        ...(typeof id === "string" && id.length > 0 ? { id } : {}),
        type,
        url: url.trim(),
      });
    }
    return items;
  } catch {
    return null;
  }
}
