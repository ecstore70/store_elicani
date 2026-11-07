import type { MetadataRoute } from "next";
import { getMarketingUrl } from "@/lib/env";

/**
 * robots.txt público — permitir tudo e apontar o Search Console para o
 * sitemap (que lista home, lojas ativas e produtos — ver `sitemap.ts`).
 *
 * NÃO se bloqueia o checkout (`/store/{slug}/checkout`) aqui: essas
 * páginas já saem com `noindex` no próprio HTML (metadata da rota) e
 * bloquear a URL em robots.txt impediria o Google de LER esse noindex —
 * a clássica armadilha de "bloqueado, mas indexado sem conteúdo".
 */
export default function robots(): MetadataRoute.Robots {
  const base = getMarketingUrl().replace(/\/+$/, "");
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
