import type { SupabaseClient } from "@supabase/supabase-js";
import type { MessageKey } from "@/lib/i18n/messages/en.ts";
import {
  IMAGE_MAX_BYTES,
  IMAGE_MIME_TYPES,
  MEDIA_BUCKET,
  VIDEO_MAX_BYTES,
  VIDEO_MIME_TYPES,
  type MediaType,
} from "./media.ts";

/**
 * Upload de mídia de produto — CLIENTE, compartilhado pela galeria e pelos
 * blocos de conteúdo da página (UM caminho de armazenamento só: bucket
 * `product-media`, caminho `{store_id}/{uuid}.{ext}` para a política de RLS
 * `owns_store_folder`).
 *
 * A validação usa as MESMAS constantes de media.ts (tipo/bamanho); a
 * mensagem de erro é escolhida por quem chama, para manter os textos de
 * cada contexto.
 */

const EXT_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

export type UploadFailure = "type" | "size" | "upload";

/**
 * Envia um arquivo para o bucket do produto e devolve a URL pública.
 * `failure` diz o que deu errado (tipo não suportado / arquivo grande /
 * falha do storage) para a UI traduzir no contexto certo.
 */
export async function uploadProductMediaFile(
  supabase: SupabaseClient,
  storeId: string,
  file: File,
  kind: MediaType,
): Promise<{ url: string } | { failure: UploadFailure }> {
  const allowed = kind === "image" ? IMAGE_MIME_TYPES : VIDEO_MIME_TYPES;
  const maxBytes = kind === "image" ? IMAGE_MAX_BYTES : VIDEO_MAX_BYTES;

  if (!(allowed as readonly string[]).includes(file.type)) {
    return { failure: "type" };
  }
  if (file.size > maxBytes) {
    return { failure: "size" };
  }

  const path = `${storeId}/${crypto.randomUUID()}.${EXT_BY_MIME[file.type] ?? "bin"}`;
  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) {
    return { failure: "upload" };
  }

  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl };
}

/** Mapeia a falha para as mensagens JÁ existentes da galeria. */
export function uploadFailureMessageKey(
  failure: UploadFailure,
  kind: MediaType,
): MessageKey {
  if (failure === "type") return "products.gallery.unsupportedType";
  if (failure === "upload") return "products.gallery.uploadFailed";
  return kind === "image"
    ? "products.gallery.imageTooLarge"
    : "products.gallery.videoTooLarge";
}
