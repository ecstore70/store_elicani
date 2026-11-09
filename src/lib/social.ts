/**
 * Identificação de rede social a partir da URL configurada pelo comerciante.
 *
 * A coluna chama-se `facebook_url`, mas o ícone é decidido pelo HOSTNAME
 * da URL guardada — nunca pelo nome do campo: se o comerciante colar uma
 * URL do Instagram no campo do Facebook, a vitrine mostra o ícone do
 * Instagram (e o aria-label correto), nunca uma etiqueta errada.
 *
 * Não é um segundo sistema social: existem apenas DOIS campos na base
 * (`instagram_url`, `facebook_url` — migration 20261030130000_store_identity)
 * e este módulo apenas reconhece o que qualquer dessas URLs possa conter.
 * Redes desconhecidas devolvem `null` — a UI cai num ícone genérico
 * neutro e mantém o link visível.
 *
 * Correspondência por SUFIXO do hostname normalizado (`new URL` já devolve
 * lowercase e descarta `www.` ao comparar via sufixo com ponto):
 *
 *   https://www.instagram.com/myshop/?hl=en → instagram ✓
 *   http://m.facebook.com/pagina            → facebook  ✓
 *   https://tiktok.com/@loja                → tiktok    ✓
 *   https://wa.me/3519…                     → whatsapp  ✓
 *
 * Paths, query strings e trailing slashes são ignorados — só o hostname
 * decide. Strings malformadas → `null` (fallback neutro na UI).
 *
 * SEGURANÇA: o comerciante fornece apenas a URL (texto). Nenhum SVG/HTML
 * fornecido pelo comerciante é executado — a chave devolvida aqui é
 * procurada no mapa INTERNO de glifos de `components/shared/social-icon.tsx`.
 *
 * Nomes de marca (Facebook, Instagram, …) não se traduzem — mesmo
 * critério do `WhatsAppIcon` existente; só o texto envolvente usa i18n.
 */

export type SocialNetwork =
  | "facebook"
  | "instagram"
  | "x"
  | "tiktok"
  | "youtube"
  | "linkedin"
  | "pinterest"
  | "threads"
  | "snapchat"
  | "whatsapp";

/** Domínio canônico → rede. Subdomínios cobertos pela regra de sufixo. */
const DOMAIN_NETWORKS: Record<string, SocialNetwork> = {
  "facebook.com": "facebook",
  "fb.me": "facebook",
  "instagram.com": "instagram",
  "twitter.com": "x",
  "x.com": "x",
  "tiktok.com": "tiktok",
  "youtube.com": "youtube",
  "youtu.be": "youtube",
  "linkedin.com": "linkedin",
  "pinterest.com": "pinterest",
  "threads.net": "threads",
  "snapchat.com": "snapchat",
  "whatsapp.com": "whatsapp",
  "wa.me": "whatsapp",
};

/** Nome oficial da rede — aria-label; nomes de marca nunca se traduzem. */
export const SOCIAL_NETWORK_LABELS: Record<SocialNetwork, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  x: "X",
  tiktok: "TikTok",
  youtube: "YouTube",
  linkedin: "LinkedIn",
  pinterest: "Pinterest",
  threads: "Threads",
  snapchat: "Snapchat",
  whatsapp: "WhatsApp",
};

/** Rede social da URL, ou `null` se não for reconhecida/parseável. */
export function identifySocialNetwork(url: string): SocialNetwork | null {
  let host: string;
  try {
    host = new URL(url).hostname;
  } catch {
    return null;
  }
  if (!host) return null;

  for (const [domain, network] of Object.entries(DOMAIN_NETWORKS)) {
    // igual ao domínio ou subdomínio dele (o ponto à esquerda impede
    // falsos positivos tipo "notinstagram.com").
    if (host === domain || host.endsWith(`.${domain}`)) return network;
  }
  return null;
}

/** Hostname da URL para rótulos de redes desconhecidas; `null` se inválida. */
export function hostnameOf(url: string): string | null {
  try {
    const host = new URL(url).hostname;
    return host || null;
  } catch {
    return null;
  }
}

/**
 * aria-label do link social: nome da rede quando reconhecida; caso
 * contrário o próprio hostname (honesto — nunca finge ser uma marca);
 * em último recurso a URL crua.
 */
export function socialAriaLabel(url: string): string {
  const network = identifySocialNetwork(url);
  if (network) return SOCIAL_NETWORK_LABELS[network];
  return hostnameOf(url) ?? url;
}
