"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { ChevronLeft, ChevronRight, Film, Play } from "lucide-react";
import {
  extractYouTubeId,
  isYouTubeUrl,
  youtubeEmbedUrl,
} from "@/lib/catalog/media";
import type { PublicMediaItem } from "@/lib/catalog/types";
import type { StorefrontStrings } from "@/lib/storefront/strings";

type SlideProps = {
  item: PublicMediaItem;
  productName: string;
  strings: StorefrontStrings;
  allowAuto: boolean;
};

/**
 * Slide ativo — o estado (falha/toque) vive AQUI e é zerado por `key`
 * quando o índice muda (sem efeito de reset).
 */
function ActiveSlide({ item, productName, strings, allowAuto }: SlideProps) {
  const [failed, setFailed] = useState(false);
  const [videoStarted, setVideoStarted] = useState(false);

  const youtubeId =
    item.type === "video" && isYouTubeUrl(item.url)
      ? extractYouTubeId(item.url)
      : null;

  if (failed) {
    return (
      <div
        role="status"
        className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center text-sm text-[var(--sf-muted)]"
      >
        <Film aria-hidden="true" className="size-8" />
        {strings.galleryUnavailable}
      </div>
    );
  }

  if (item.type === "image") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={item.url}
        alt={`${strings.productImageAlt}: ${productName}`}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-contain p-4 sm:p-6"
      />
    );
  }

  if (youtubeId) {
    if (allowAuto || videoStarted) {
      return (
        <iframe
          key={allowAuto && !videoStarted ? "auto" : "manual"}
          src={youtubeEmbedUrl(youtubeId, allowAuto && !videoStarted)}
          title={strings.galleryVideo}
          loading="lazy"
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      );
    }
    return (
      <button
        type="button"
        onClick={() => setVideoStarted(true)}
        aria-label={strings.galleryPlay}
        className="absolute inset-0 flex items-center justify-center bg-black/5 text-[var(--sf-muted)] transition-colors hover:bg-black/10"
      >
        <Play
          aria-hidden="true"
          className="size-12 fill-current text-[var(--sf-fg)]"
        />
      </button>
    );
  }

  return (
    <video
      key={item.url}
      src={item.url}
      controls
      muted
      playsInline
      autoPlay={allowAuto}
      preload="metadata"
      onError={() => setFailed(true)}
      className="absolute inset-0 h-full w-full bg-black object-contain"
    />
  );
}

/** Autoplay permitido? Redução de movimento ou Save-Data desligam. */
function subscribeReducedMotion(onChange: () => void) {
  const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  mediaQuery.addEventListener("change", onChange);
  return () => mediaQuery.removeEventListener("change", onChange);
}

function readAllowAuto() {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const connection = (
    navigator as Navigator & { connection?: { saveData?: boolean } }
  ).connection;
  return !reduced && !connection?.saveData;
}

/**
 * Galeria de mídia da vitrine (cliente).
 *
 * • Só o slide ATIVO é renderizado (mídia dos demais carrega ao navegar);
 * • vídeo inline toca mudo (`muted` + `playsInline`) e o YouTube usa
 *   exclusivamente o embed `youtube-nocookie` montado a partir do ID
 *   validado — nenhum HTML do comerciante;
 * • autoplay respeita `prefers-reduced-motion` e `Save-Data`;
 * • navegação por botões (acionáveis) e swipe tátil.
 */
export function ProductGallery({
  items,
  productName,
  strings,
}: {
  items: PublicMediaItem[];
  productName: string;
  strings: StorefrontStrings;
}) {
  const [index, setIndex] = useState(0);
  const touchStart = useRef<number | null>(null);
  const allowAuto = useSyncExternalStore(
    subscribeReducedMotion,
    readAllowAuto,
    () => false,
  );

  if (items.length === 0) return null;

  const active = items[Math.min(index, items.length - 1)];
  const go = (next: number) =>
    setIndex(Math.max(0, Math.min(items.length - 1, next)));

  return (
    <div
      role="group"
      aria-label={strings.galleryLabel}
      className="w-full"
      onTouchStart={(event) => {
        touchStart.current = event.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        if (touchStart.current === null) return;
        const delta = (event.changedTouches[0]?.clientX ?? 0) - touchStart.current;
        touchStart.current = null;
        if (Math.abs(delta) > 40) go(index + (delta > 0 ? -1 : 1));
      }}
    >
      <div className="relative aspect-square w-full">
        <ActiveSlide
          key={index}
          item={active}
          productName={productName}
          strings={strings}
          allowAuto={allowAuto}
        />

        {items.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(index - 1)}
              disabled={index === 0}
              aria-label={strings.galleryPrevious}
              className="absolute start-1.5 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white shadow-sm transition-opacity hover:bg-black/60 disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronLeft aria-hidden="true" className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              disabled={index === items.length - 1}
              aria-label={strings.galleryNext}
              className="absolute end-1.5 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white shadow-sm transition-opacity hover:bg-black/60 disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronRight aria-hidden="true" className="size-5" />
            </button>
          </>
        )}
      </div>

      {items.length > 1 && (
        <ul className="flex gap-2 overflow-x-auto border-t border-[var(--sf-border)] p-2">
          {items.map((item, itemIndex) => (
            <li key={item.url}>
              <button
                type="button"
                onClick={() => go(itemIndex)}
                aria-label={`${strings.galleryLabel} ${itemIndex + 1}`}
                aria-current={itemIndex === index}
                className={`size-14 shrink-0 overflow-hidden rounded border transition-opacity ${
                  itemIndex === index
                    ? "border-[var(--sf-fg)] opacity-100"
                    : "border-[var(--sf-border)] opacity-60 hover:opacity-90"
                }`}
              >
                {item.type === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.url}
                    alt=""
                    loading="lazy"
                    className="size-full object-cover"
                  />
                ) : (
                  <span className="flex size-full items-center justify-center bg-[var(--sf-surface)] text-[var(--sf-muted)]">
                    <Film aria-hidden="true" className="size-5" />
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
