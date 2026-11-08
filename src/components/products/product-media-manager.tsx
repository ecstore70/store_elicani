"use client";

import { useRef, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Film,
  ImagePlus,
  Loader2,
  Star,
  Trash2,
  Video,
} from "lucide-react";
import { FormAlert } from "@/components/shared/form-alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  canonicalYouTubeUrl,
  extractYouTubeId,
  IMAGE_MIME_TYPES,
  MEDIA_MAX_ITEMS,
  VIDEO_MIME_TYPES,
  type MediaItemInput,
} from "@/lib/catalog/media";
import {
  uploadFailureMessageKey,
  uploadProductMediaFile,
} from "@/lib/catalog/media-upload";
import type { Locale } from "@/lib/i18n/config";
import { createTranslator } from "@/lib/i18n/translate";
import { createClient } from "@/lib/supabase/client";

/**
 * Gerenciador de galeria do produto (dentro do formulário).
 *
 * • Upload direto ao bucket `product-media` pelo browser (sem passar por
 *   funções de servidor — vídeos de até 100 MB não cabem em POST de action);
 *   caminho `{store_id}/{uuid}.{ext}` para satisfazer a política de RLS
 *   `owns_store_folder`.
 * • O estado vive aqui; o formulário recebe o JSON no campo oculto `media`,
 *   que a action reconcilia no servidor (servidor sempre é a autoridade).
 * • Vídeos do YouTube entram por URL canônica (ID validado em media.ts).
 */
export function ProductMediaManager({
  locale,
  storeId,
  initialItems,
}: {
  locale: Locale;
  storeId: string;
  initialItems: MediaItemInput[];
}) {
  const t = createTranslator(locale);
  const [items, setItems] = useState<MediaItemInput[]>(initialItems);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const imageInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);

  const firstImageIndex = items.findIndex((item) => item.type === "image");

  async function addFiles(
    event: React.ChangeEvent<HTMLInputElement>,
    kind: "image" | "video",
  ) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = ""; // permite re-selecionar o mesmo arquivo
    if (files.length === 0 || busy) return;

    setError(null);
    setBusy(true);
    try {
      const supabase = createClient();
      const known = new Set(items.map((item) => item.url));
      const added: MediaItemInput[] = [];

      for (const file of files) {
        if (items.length + added.length >= MEDIA_MAX_ITEMS) {
          setError(t("products.error.mediaTooMany"));
          break;
        }

        const result = await uploadProductMediaFile(
          supabase,
          storeId,
          file,
          kind,
        );
        if ("failure" in result) {
          setError(t(uploadFailureMessageKey(result.failure, kind)));
          continue;
        }
        if (known.has(result.url)) continue;
        known.add(result.url);
        added.push({ type: kind, url: result.url });
      }

      if (added.length > 0) {
        setItems((current) => [...current, ...added]);
      }
    } finally {
      setBusy(false);
    }
  }

  function addYoutube() {
    const id = extractYouTubeId(youtubeUrl);
    if (!id) {
      setError(t("products.error.mediaInvalid"));
      return;
    }
    const url = canonicalYouTubeUrl(id);
    if (items.some((item) => item.url === url)) {
      setYoutubeUrl("");
      return;
    }
    if (items.length >= MEDIA_MAX_ITEMS) {
      setError(t("products.error.mediaTooMany"));
      return;
    }
    setError(null);
    setItems((current) => [...current, { type: "video", url }]);
    setYoutubeUrl("");
  }

  function move(index: number, direction: -1 | 1) {
    setItems((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function makePrimary(index: number) {
    setItems((current) => {
      if (index === 0) return current;
      const next = [...current];
      const [item] = next.splice(index, 1);
      next.unshift(item);
      return next;
    });
  }

  function removeAt(index: number) {
    setItems((current) => current.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-4 sm:col-span-2">
      {/* Estado trafegado para a action (servidor reconcilia). */}
      <input type="hidden" name="media" value={JSON.stringify(items)} />

      {error && <FormAlert tone="error">{error}</FormAlert>}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => imageInput.current?.click()}
        >
          <ImagePlus aria-hidden="true" data-icon="inline-start" />
          {t("products.gallery.images")}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => videoInput.current?.click()}
        >
          <Video aria-hidden="true" data-icon="inline-start" />
          {t("products.gallery.videos")}
        </Button>
        <input
          ref={imageInput}
          type="file"
          multiple
          hidden
          accept={IMAGE_MIME_TYPES.join(",")}
          onChange={(event) => addFiles(event, "image")}
        />
        <input
          ref={videoInput}
          type="file"
          multiple
          hidden
          accept={VIDEO_MIME_TYPES.join(",")}
          onChange={(event) => addFiles(event, "video")}
        />
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

      <div className="flex gap-2">
        <div className="min-w-0 flex-1 space-y-1.5">
          <Label htmlFor="media-youtube" className="sr-only">
            {t("products.gallery.youtubePlaceholder")}
          </Label>
          <Input
            id="media-youtube"
            type="url"
            inputMode="url"
            autoCapitalize="none"
            spellCheck={false}
            placeholder={t("products.gallery.youtubePlaceholder")}
            value={youtubeUrl}
            onChange={(event) => setYoutubeUrl(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addYoutube();
              }
            }}
          />
        </div>
        <Button type="button" size="sm" onClick={addYoutube}>
          {t("products.gallery.youtubeAdd")}
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t("products.gallery.empty")}
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item, index) => {
            const isPrimary = index === firstImageIndex;
            return (
              <li
                key={item.url}
                className="overflow-hidden rounded-lg border border-border/70"
              >
                <div className="relative aspect-square bg-muted">
                  {item.type === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.url}
                      alt=""
                      loading="lazy"
                      className="size-full object-cover"
                    />
                  ) : (
                    <div
                      role="img"
                      aria-label={t("products.gallery.videoBadge")}
                      className="flex size-full items-center justify-center"
                    >
                      <Film
                        aria-hidden="true"
                        className="size-8 text-muted-foreground"
                      />
                    </div>
                  )}
                  {item.type === "video" || isPrimary ? (
                    <span className="absolute end-1.5 top-1.5 rounded bg-background/90 px-1.5 py-0.5 text-[10px] font-medium shadow-sm">
                      {item.type === "video"
                        ? t("products.gallery.videoBadge")
                        : t("products.gallery.primary")}
                    </span>
                  ) : null}
                </div>

                <div className="flex items-center justify-between gap-1 p-1.5">
                  <div className="flex gap-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t("products.moveUp")}
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                    >
                      <ChevronUp aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t("products.moveDown")}
                      disabled={index === items.length - 1}
                      onClick={() => move(index, 1)}
                    >
                      <ChevronDown aria-hidden="true" />
                    </Button>
                  </div>
                  <div className="flex gap-0.5">
                    {item.type === "image" && !isPrimary && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t("products.gallery.setPrimary")}
                        onClick={() => makePrimary(index)}
                      >
                        <Star aria-hidden="true" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t("products.gallery.remove")}
                      onClick={() => removeAt(index)}
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
