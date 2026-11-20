"use client";

import { useEffect, useRef, useState } from "react";
import { Share2 } from "lucide-react";
import { shareProduct } from "@/lib/storefront/share-product";
import type { StorefrontStrings } from "@/lib/storefront/strings";

/**
 * Botão "Share product" da PÁGINA DE PRODUTO — única parte client da
 * partilha (Web Share API + clipboard). Tudo o que precisa chega nas
 * props, derivadas no servidor pela própria rota:
 *
 *  • `productName` — o produto QUE ESTA página renderiza;
 *  • `productUrl`  — a URL canónica dessa mesma página.
 *
 * Sem estado global, sem localStorage/sessionStorage/cookies: cada
 * página de produto monta o seu próprio botão, para qualquer loja/
 * mercador da plataforma (nenhum valor fixo de loja, produto ou
 * domínio neste componente).
 *
 * Comportamento do clique: share nativo quando existe → senão copiar
 * a URL canónica e anunciar "Link copied" via `role="status"`
 * (não-bloqueante). Falha de clipboard nunca quebra a página.
 * Ação SEPARADA do CTA flutuante de WhatsApp (mensagem de inquiry
 * continua a ser só dele).
 */

/** Mesma linguagem visual do outline da página de produto. */
const OUTLINE_CLASSES =
  "inline-flex items-center justify-center gap-1.5 rounded-[var(--sf-btn-radius)] border border-[var(--sf-border)] bg-[var(--sf-surface)] px-[var(--sf-btn-px)] py-[var(--sf-btn-py)] text-sm font-medium text-[var(--sf-fg)] transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sf-primary)]";

const CONFIRM_MS = 2600;

export function ProductShare({
  productName,
  productUrl,
  strings,
}: {
  /** Nome do produto em exibição (conteúdo do comerciante, como está). */
  productName: string;
  /** URL canónica da página do produto atual. */
  productUrl: string;
  strings: StorefrontStrings;
}) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Limpa o temporizador ao desmontar (nunca avisar num botão morto).
  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const handleShare = async () => {
    const outcome = await shareProduct(productName, productUrl, {
      share:
        typeof navigator !== "undefined" && typeof navigator.share === "function"
          ? (data) => navigator.share(data)
          : undefined,
      writeText:
        typeof navigator !== "undefined" && navigator.clipboard?.writeText
          ? (text) => navigator.clipboard.writeText(text)
          : undefined,
    });

    // Só a cópia BEM-SUCEDIDA mostra a confirmação (share nativo já
    // tem o seu próprio feedback; falhas ficam silenciosas).
    if (outcome !== "copied") return;
    setCopied(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), CONFIRM_MS);
  };

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <button type="button" onClick={handleShare} className={OUTLINE_CLASSES}>
        <Share2 aria-hidden="true" className="size-4" />
        {strings.shareProduct}
      </button>
      {/* Confirmação discreta e acessível do fallback de cópia. */}
      <span
        role="status"
        aria-live="polite"
        className="text-xs text-[var(--sf-muted)]"
      >
        {copied ? strings.linkCopied : ""}
      </span>
    </div>
  );
}
