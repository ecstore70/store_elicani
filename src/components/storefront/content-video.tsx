"use client";

import { useEffect, useRef } from "react";

/**
 * Vídeo de um bloco de conteúdo da página do produto (cliente).
 *
 * • um vídeo por vez: ao iniciar QUALQUER vídeo de conteúdo, os demais
 *   pausam (escuta em fase de captura no document — `play` não borbulha);
 * • saiu da tela → pausa (nada toca escondido);
 * • sem autoplay: controles nativos, `playsInline`, `preload="metadata"`.
 */
export function ContentVideo({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null);

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
          if (!entry.isIntersecting && !video.paused) video.pause();
        }
      },
      { threshold: 0.25 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      data-content-video="1"
      src={src}
      controls
      playsInline
      preload="metadata"
      className="aspect-video w-full bg-black object-contain"
    />
  );
}
