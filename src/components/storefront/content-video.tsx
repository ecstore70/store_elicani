"use client";

import { useEffect, useRef, useState } from "react";
import { Film, Volume2, VolumeX } from "lucide-react";
import { resolveVideoAspect } from "@/lib/catalog/video-aspect";
import type { StorefrontStrings } from "@/lib/storefront/strings";

/**
 * Vídeo de um bloco de conteúdo da página do produto (cliente).
 *
 * • um vídeo por vez: ao iniciar QUALQUER vídeo de conteúdo, os demais
 *   pausam (escuta em fase de captura no document — `play` não borbulha);
 * • entrou na área visível → toca; saiu da tela → pausa (nada toca
 *   escondido); voltou → retoma com o estado de som escolhido (se o
 *   browser bloquear reprodução com som, silencia e tenta de novo);
 * • a primeira reprodução é SEMPRE muda — `muted` é garantido antes de
 *   `play()`, exigência das políticas de autoplay do browser;
 * • inline no mobile (`playsInline`), `preload="metadata"`: só os bytes
 *   do bloco são baixados quando ele se aproxima da viewport;
 * • sem controles nativos grandes: botão próprio de som no canto;
 * • moldura responsiva com a proporção intrínseca do arquivo — sem
 *   distorção, sem corte (`object-fit: contain`), centrada; a altura é
 *   limitada a `min(70vh, 640px)` para vertical não tomar a tela toda nem
 *   virar um bloco gigante no desktop. Sem detecção de user-agent: só
 *   CSS responsivo + dimensões reais do vídeo.
 */
export function ContentVideo({
  src,
  strings,
}: {
  src: string;
  strings: StorefrontStrings;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  /** Espelho do estado de som para o observer (efeito roda uma única vez). */
  const mutedRef = useRef(true);
  const [muted, setMuted] = useState(true);
  const [failed, setFailed] = useState(false);
  const [aspect, setAspect] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    const onPlay = (event: Event) => {
      const target = event.target;
      if (
        target instanceof HTMLVideoElement &&
        target !== ref.current &&
        target.dataset.contentVideo === "1"
      ) {
        target.pause();
      }
    };
    document.addEventListener("play", onPlay, true);
    return () => document.removeEventListener("play", onPlay, true);
  }, []);

  useEffect(() => {
    const video = ref.current;
    if (!video || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            if (!video.paused) continue;
            // Estado atual espelhado em mutedRef (o efeito não re-renderiza).
            video.muted = mutedRef.current;
            video.play().catch(() => {
              // Autoplay com som bloqueado → silencia e repete mudo.
              if (video.muted) return;
              video.muted = true;
              mutedRef.current = true;
              setMuted(true);
              video.play().catch(() => {});
            });
          } else if (!video.paused) {
            video.pause();
          }
        }
      },
      { threshold: 0.25 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  const toggleSound = () => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    if (ref.current) ref.current.muted = next;
  };

  const onLoadedMetadata = () => {
    const video = ref.current;
    if (!video) return;
    setAspect(resolveVideoAspect(video.videoWidth, video.videoHeight));
  };

  const { w: arW, h: arH } = aspect ?? { w: 16, h: 9 };
  const frameStyle = {
    width: `min(100%, calc(min(70vh, 640px) * ${arW} / ${arH}))`,
    aspectRatio: `${arW} / ${arH}`,
  } as const;

  return (
    <div className="flex w-full justify-center">
      <div className="relative overflow-hidden bg-black" style={frameStyle}>
        {failed ? (
          <div
            role="status"
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center text-sm text-white/80"
          >
            <Film aria-hidden="true" className="size-8" />
            {strings.galleryUnavailable}
          </div>
        ) : (
          <>
            <video
              ref={ref}
              data-content-video="1"
              src={src}
              muted={muted}
              playsInline
              preload="metadata"
              onLoadedMetadata={onLoadedMetadata}
              onError={() => setFailed(true)}
              className="absolute inset-0 h-full w-full object-contain"
            />
            <button
              type="button"
              onClick={toggleSound}
              aria-label={muted ? strings.videoSoundOn : strings.videoSoundOff}
              className="absolute bottom-2 end-2 z-10 flex size-9 items-center justify-center rounded-full bg-black/45 text-white shadow-sm transition-colors hover:bg-black/65 focus-visible:ring-2 focus-visible:ring-white/80"
            >
              {muted ? (
                <VolumeX aria-hidden="true" className="size-5" />
              ) : (
                <Volume2 aria-hidden="true" className="size-5" />
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
