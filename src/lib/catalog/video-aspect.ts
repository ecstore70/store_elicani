/**
 * Proporção da moldura de vídeo — PURO (sem cliente).
 *
 * A moldura usa o `aspect-ratio` intrínseco do arquivo (detectado em
 * `loadedmetadata`) para não distorcer nem cortar o conteúdo: vertical
 * (9:16) fica vertical, horizontal (16:9) fica horizontal. Sem metadata
 * (fonte inválida ou ainda não carregada) o padrão é 16:9 — o desenho
 * atual da página.
 */
export type VideoAspect = { w: number; h: number };

const FALLBACK: VideoAspect = { w: 16, h: 9 };

/**
 * Converte as dimensões intrínsecas do vídeo (`videoWidth` × `videoHeight`)
 * na proporção da moldura. Qualquer valor não positivo ou não finito —
 * inclusive o 0×0 antes do metadata — cai no padrão 16:9.
 */
export function resolveVideoAspect(
  videoWidth: number,
  videoHeight: number,
): VideoAspect {
  if (
    !Number.isFinite(videoWidth) ||
    !Number.isFinite(videoHeight) ||
    videoWidth <= 0 ||
    videoHeight <= 0
  ) {
    return { ...FALLBACK };
  }
  return { w: videoWidth, h: videoHeight };
}
