"use client";

import { useRef, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Film,
  ImagePlus,
  Loader2,
  Pencil,
  Trash2,
  Type,
  Video,
} from "lucide-react";
import { FormAlert } from "@/components/shared/form-alert";
import { PageContent } from "@/components/storefront/page-content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  IMAGE_MIME_TYPES,
  VIDEO_MIME_TYPES,
  type MediaItemInput,
} from "@/lib/catalog/media";
import {
  uploadFailureMessageKey,
  uploadProductMediaFile,
} from "@/lib/catalog/media-upload";
import type { PageBlockInput, PageBlockType } from "@/lib/catalog/page-blocks";
import type { Locale } from "@/lib/i18n/config";
import { createTranslator } from "@/lib/i18n/translate";
import { buildStorefrontStrings } from "@/lib/storefront/strings";
import { createClient } from "@/lib/supabase/client";

/** Bloco no estado do editor: o `key` é só para o React (não é serializado). */
type EditorBlock = PageBlockInput & { key: string };

function serialize(blocks: EditorBlock[]): string {
  return JSON.stringify(
    blocks.map((block) => ({
      type: block.type,
      content: block.content,
      media_url: block.media_url,
      caption: block.caption,
      alt_text: block.alt_text,
    })),
  );
}

const TYPE_LABEL: Record<PageBlockType, "products.block.image" | "products.block.text" | "products.block.video"> = {
  image: "products.block.image",
  text: "products.block.text",
  video: "products.block.video",
};

/**
 * Editor de conteúdo da página do produto (dentro do formulário).
 *
 * • Sequência opcional de blocos imagem/texto/vídeo com ↑/↓, editar e
 *   remover — o JSON trafega no campo oculto `page_blocks`, que a action
 *   valida e reconcilia no servidor (servidor sempre é a autoridade);
 * • uploads usam o MESMO bucket `product-media` da galeria (caminho
 *   `{store_id}/{uuid}.{ext}` para a política `owns_store_folder`);
 * • imagem pode sair do upload OU da galeria existente (mesmo arquivo,
 *   sem duplicar nada);
 * • vídeo: URL do YouTube (embed montado por nós) ou upload próprio;
 * • texto: subconjunto seguro (## , **negrito**, *itálico*, - listas,
 *   [texto](https://link)) — nunca HTML cru;
 * • pré-visualização reusa o MESMO componente da vitrine.
 */
export function PageContentEditor({
  locale,
  storeId,
  initialBlocks,
  galleryItems,
}: {
  locale: Locale;
  storeId: string;
  initialBlocks?: PageBlockInput[];
  /** Galeria atual (para escolher imagem existente — só imagens). */
  galleryItems?: MediaItemInput[];
}) {
  const t = createTranslator(locale);
  const [blocks, setBlocks] = useState<EditorBlock[]>(() =>
    (initialBlocks ?? []).map((block) => ({
      ...block,
      key: crypto.randomUUID(),
    })),
  );
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInput = useRef<HTMLInputElement>(null);
  const uploadTarget = useRef<{ key: string; kind: "image" | "video" } | null>(
    null,
  );

  const galleryImages = (galleryItems ?? []).filter(
    (item) => item.type === "image",
  );

  function addBlock(type: PageBlockType) {
    const block: EditorBlock = { key: crypto.randomUUID(), type };
    if (type === "text") block.content = "";
    if (type === "image" || type === "video") block.media_url = "";
    setBlocks((current) => [...current, block]);
    setEditingKey(block.key);
    setAdding(false);
  }

  function updateBlock(key: string, patch: Partial<PageBlockInput>) {
    setBlocks((current) =>
      current.map((block) =>
        block.key === key ? { ...block, ...patch } : block,
      ),
    );
  }

  function moveBlock(key: string, direction: -1 | 1) {
    setBlocks((current) => {
      const index = current.findIndex((block) => block.key === key);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function removeBlock(key: string) {
    setBlocks((current) => current.filter((block) => block.key !== key));
    if (editingKey === key) setEditingKey(null);
  }

  function pickFile(key: string, kind: "image" | "video") {
    uploadTarget.current = { key, kind };
    const input = fileInput.current;
    if (!input) return;
    input.accept = (
      kind === "image" ? IMAGE_MIME_TYPES : VIDEO_MIME_TYPES
    ).join(",");
    input.click();
  }

  async function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    const target = uploadTarget.current;
    if (!file || !target || busy) return;

    setError(null);
    setBusy(true);
    try {
      const supabase = createClient();
      const result = await uploadProductMediaFile(
        supabase,
        storeId,
        file,
        target.kind,
      );
      if ("failure" in result) {
        setError(t(uploadFailureMessageKey(result.failure, target.kind)));
        return;
      }
      updateBlock(target.key, { media_url: result.url });
    } finally {
      setBusy(false);
    }
  }

  const serialized = serialize(blocks);

  return (
    <div className="space-y-4 sm:col-span-2">
      {/* Estado trafegado para a action (servidor reconcilia). */}
      <input type="hidden" name="page_blocks" value={serialized} />
      <input
        ref={fileInput}
        type="file"
        hidden
        onChange={onFileChange}
      />

      {error && <FormAlert tone="error">{error}</FormAlert>}

      {blocks.length === 0 && !previewing && (
        <p className="text-sm text-muted-foreground">
          {t("products.pageContentEmpty")}
        </p>
      )}

      {blocks.length > 0 && (
        <ol className="space-y-3">
          {blocks.map((block, index) => {
            const editing = editingKey === block.key;
            return (
              <li
                key={block.key}
                className="overflow-hidden rounded-lg border border-border/70 bg-background"
              >
                <div className="flex items-center gap-2 p-2">
                  <span className="text-xs font-medium tabular-nums text-muted-foreground">
                    {`#${index + 1}`}
                  </span>
                  <span className="text-sm font-medium">
                    {t(TYPE_LABEL[block.type])}
                  </span>

                  <div className="ms-auto flex gap-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t("products.moveUp")}
                      disabled={index === 0}
                      onClick={() => moveBlock(block.key, -1)}
                    >
                      <ChevronUp aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t("products.moveDown")}
                      disabled={index === blocks.length - 1}
                      onClick={() => moveBlock(block.key, 1)}
                    >
                      <ChevronDown aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t("products.block.edit")}
                      aria-expanded={editing}
                      onClick={() => {
                        setAdding(false);
                        setEditingKey(editing ? null : block.key);
                      }}
                    >
                      <Pencil aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t("products.block.remove")}
                      onClick={() => removeBlock(block.key)}
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </div>
                </div>

                {/* Pré-visualização da linha (quando não está em edição). */}
                {!editing && (
                  <div className="flex items-center gap-3 border-t border-border/70 px-3 py-2">
                    {block.type === "image" &&
                      (block.media_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={block.media_url}
                          alt=""
                          loading="lazy"
                          className="size-12 rounded border border-border/70 object-cover"
                        />
                      ) : (
                        <span className="flex size-12 items-center justify-center rounded border border-dashed border-border/70 text-muted-foreground">
                          <ImagePlus aria-hidden="true" className="size-4" />
                        </span>
                      ))}
                    {block.type === "video" && (
                      <Film
                        aria-hidden="true"
                        className="size-4 shrink-0 text-muted-foreground"
                      />
                    )}
                    <p className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
                      {block.type === "text"
                        ? (block.content?.trim().slice(0, 120) ||
                            t("products.block.textPlaceholder"))
                        : (block.media_url ||
                            t("products.block.textPlaceholder"))}
                    </p>
                  </div>
                )}

                {/* Campos de edição. */}
                {editing && (
                  <div className="space-y-3 border-t border-border/70 p-3">
                    {block.type === "image" && (
                      <>
                        <div className="flex flex-wrap items-center gap-3">
                          {block.media_url && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={block.media_url}
                              alt=""
                              className="size-16 rounded border border-border/70 object-cover"
                            />
                          )}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={busy}
                            onClick={() => pickFile(block.key, "image")}
                          >
                            <ImagePlus aria-hidden="true" data-icon="inline-start" />
                            {t("products.block.uploadImage")}
                          </Button>
                        </div>

                        {galleryImages.length > 0 && (
                          <div className="space-y-1.5">
                            <Label>{t("products.block.fromGallery")}</Label>
                            <div className="flex flex-wrap gap-2">
                              {galleryImages.map((item, galleryIndex) => (
                                <button
                                  key={item.url}
                                  type="button"
                                  aria-label={`${t("products.block.fromGallery")} #${galleryIndex + 1}`}
                                  aria-pressed={block.media_url === item.url}
                                  className={`overflow-hidden rounded border ${
                                    block.media_url === item.url
                                      ? "border-ring ring-2 ring-ring/40"
                                      : "border-border/70"
                                  }`}
                                  onClick={() =>
                                    updateBlock(block.key, { media_url: item.url })
                                  }
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={item.url}
                                    alt=""
                                    loading="lazy"
                                    className="size-12 object-cover"
                                  />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-1.5">
                            <Label htmlFor={`pb_${block.key}_alt`}>
                              {t("products.block.altText")}
                            </Label>
                            <Input
                              id={`pb_${block.key}_alt`}
                              name={`pb_${block.key}_alt`}
                              value={block.alt_text ?? ""}
                              maxLength={200}
                              onChange={(event) =>
                                updateBlock(block.key, {
                                  alt_text: event.target.value,
                                })
                              }
                            />
                            <p className="text-xs text-muted-foreground">
                              {t("common.optional")}
                            </p>
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor={`pb_${block.key}_caption`}>
                              {t("products.block.caption")}
                            </Label>
                            <Input
                              id={`pb_${block.key}_caption`}
                              name={`pb_${block.key}_caption`}
                              value={block.caption ?? ""}
                              maxLength={300}
                              onChange={(event) =>
                                updateBlock(block.key, {
                                  caption: event.target.value,
                                })
                              }
                            />
                            <p className="text-xs text-muted-foreground">
                              {t("common.optional")}
                            </p>
                          </div>
                        </div>
                      </>
                    )}

                    {block.type === "text" && (
                      <>
                        <Label htmlFor={`pb_${block.key}_content`}>
                          {t("products.block.text")}
                        </Label>
                        <textarea
                          id={`pb_${block.key}_content`}
                          name={`pb_${block.key}_content`}
                          value={block.content ?? ""}
                          onChange={(event) =>
                            updateBlock(block.key, {
                              content: event.target.value,
                            })
                          }
                          placeholder={t("products.block.textPlaceholder")}
                          className="min-h-32 w-full resize-y rounded-lg border border-input bg-transparent px-2.5 py-1 text-base leading-relaxed outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
                        />
                        <p className="text-xs text-muted-foreground">
                          {t("products.block.textHint")}
                        </p>
                      </>
                    )}

                    {block.type === "video" && (
                      <>
                        <div className="space-y-1.5">
                          <Label htmlFor={`pb_${block.key}_url`}>
                            {t("products.gallery.youtubePlaceholder")}
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              id={`pb_${block.key}_url`}
                              name={`pb_${block.key}_url`}
                              type="url"
                              inputMode="url"
                              autoCapitalize="none"
                              spellCheck={false}
                              placeholder={t(
                                "products.gallery.youtubePlaceholder",
                              )}
                              value={block.media_url ?? ""}
                              onChange={(event) =>
                                updateBlock(block.key, {
                                  media_url: event.target.value,
                                })
                              }
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={busy}
                              onClick={() => pickFile(block.key, "video")}
                            >
                              <Video aria-hidden="true" data-icon="inline-start" />
                              {t("products.block.uploadVideo")}
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {t("common.optional")}
                          </p>
                        </div>

                        {busy && (
                          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Loader2
                              aria-hidden="true"
                              data-icon="inline-start"
                              className="animate-spin"
                            />
                            {t("products.gallery.uploading")}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}

      {/* Adicionar conteúdo: escolhe o tipo do próximo bloco. */}
      {adding ? (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addBlock("image")}
          >
            <ImagePlus aria-hidden="true" data-icon="inline-start" />
            {t("products.block.image")}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addBlock("text")}
          >
            <Type aria-hidden="true" data-icon="inline-start" />
            {t("products.block.text")}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addBlock("video")}
          >
            <Video aria-hidden="true" data-icon="inline-start" />
            {t("products.block.video")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setAdding(false)}
          >
            {t("common.cancel")}
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingKey(null);
              setAdding(true);
            }}
          >
            <ImagePlus aria-hidden="true" data-icon="inline-start" />
            {t("products.pageContentAdd")}
          </Button>
          {blocks.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setPreviewing((current) => !current)}
            >
              {previewing ? (
                <EyeOff aria-hidden="true" data-icon="inline-start" />
              ) : (
                <Eye aria-hidden="true" data-icon="inline-start" />
              )}
              {previewing
                ? t("products.pageContentPreviewHide")
                : t("products.pageContentPreview")}
            </Button>
          )}
        </div>
      )}

      {busy && !editingKey && (
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Loader2
            aria-hidden="true"
            data-icon="inline-start"
            className="animate-spin"
          />
          {t("products.gallery.uploading")}
        </p>
      )}

      {/* Pré-visualização: o MESMO componente da vitrine. */}
      {previewing && blocks.length > 0 && (
        <div className="rounded-lg border border-border/70 bg-background p-4">
          <PageContent
            strings={buildStorefrontStrings(t)}
            blocks={blocks.map((block) => ({
              type: block.type,
              content: block.content ?? null,
              media_url: block.media_url ?? null,
              caption: block.caption ?? null,
              alt_text: block.alt_text ?? null,
            }))}
          />
        </div>
      )}
    </div>
  );
}
