import { isYouTubeShortsUrl } from "./media.ts";

/**
 * Apresentação de vídeo — PURO (sem servidor nem cliente).
 *
 * Um só conceito de proporção para TODO vídeo da vitrine: a moldura é
 * derivada de `VideoAspect { w, h }`, venha a proporção de onde vier:
 *
 *   • arquivo direto (MP4/WebM) → dimensões intrínsecas do próprio
 *     arquivo (resolveVideoAspect, em video-aspect.ts): vertical fica
 *     vertical, horizontal fica horizontal — sem barras, sem corte;
 *   • YouTube → a fonte NÃO expõe dimensões sem API externa (que este
 *     projeto não usa, de propósito): a dica de apresentação é a FORMA
 *     do URL gravado — `/shorts/<id>` é Short (vertical) → 9:16. Formas
 *     sem dica (watch, youtu.be, embed, live) → `null` → fallback 16:9,
 *     o mesmo fallback seguro de sempre — sem inventar dimensões;
 *   • sem fonte ou sem metadata → fallback 16:9.
 *
 * `videoFrameStyle` é a ÚNICA fórmula de moldura (largura responsiva com
 * teto de altura `min(70vh, 640px)` + `aspect-ratio`): usada pelo vídeo
 * nativo (ContentVideo) E pelo player de YouTube — por isso um Short
 * ocupa uma moldura 9:16 de verdade, e não um vídeo minúsculo dentro de
 * uma caixa 16:9.
 *
 * O modelo nomeia os três formatos explícitos (portrait/landscape/square)
 * para ser extensível: nenhum ponto do código fixa 9:16 universal.
 */

/** Formato de apresentação nomeado — modelo explícito e extensível. */
export type VideoPresentationRatio = "portrait" | "landscape" | "square";

/** Proporção da moldura (numerador / denominador do `aspect-ratio`). */
export type VideoAspect = { w: number; h: number };

/** Proporções nomeadas do modelo (única fonte dos formatos). */
export const VIDEO_PRESENTATION_ASPECT: Record<
  VideoPresentationRatio,
  VideoAspect
> = {
  portrait: { w: 9, h: 16 },
  landscape: { w: 16, h: 9 },
  square: { w: 1, h: 1 },
};

/** Fallback seguro p/ proporção desconhecida — 16:9 (o de sempre). */
export const FALLBACK_VIDEO_ASPECT: VideoAspect = { w: 16, h: 9 };

/**
 * Dica de apresentação de um URL do YouTube: `null` = desconhecida (não
 * inventa dimensões). Short gravado com `/shorts/` → vertical.
 */
export function youtubePresentation(
  rawUrl: string,
): VideoPresentationRatio | null {
  return isYouTubeShortsUrl(rawUrl) ? "portrait" : null;
}

/** Proporção da moldura de um URL do YouTube: dica da fonte ou fallback. */
export function resolveYoutubeAspect(rawUrl: string): VideoAspect {
  const presentation = youtubePresentation(rawUrl);
  return presentation
    ? { ...VIDEO_PRESENTATION_ASPECT[presentation] }
    : { ...FALLBACK_VIDEO_ASPECT };
}

/**
 * Fórmula ÚNICA da moldura de vídeo: a largura segue o conteúdo, limitada
 * pela altura do viewport (`min(70vh, 640px)`), e a ALTURA deriva da
 * proporção — nunca o contrário. Ex.: portrait 9:16 → no máximo
 * 360×640 no desktop e a largura toda do conteúdo em telas estreitas.
 */
export function videoFrameStyle(aspect: VideoAspect): {
  width: string;
  aspectRatio: string;
} {
  return {
    width: `min(100%, calc(min(70vh, 640px) * ${aspect.w} / ${aspect.h}))`,
    aspectRatio: `${aspect.w} / ${aspect.h}`,
  };
}
