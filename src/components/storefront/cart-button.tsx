"use client";

import { ShoppingBag } from "lucide-react";
import { useCart } from "./cart-provider";
import type { StorefrontStrings } from "@/lib/storefront/strings";

/**
 * Botão do carrinho no CABEÇALHO da vitrine — acesso sempre visível
 * (mobile e desktop), com contagem viva do mesmo estado do provider.
 * O botão flutuante do `CartProvider` continua a existir para o alcance
 * com o polegar em páginas longas.
 */
export function CartButton({ strings }: { strings: StorefrontStrings }) {
  const { count, setOpen } = useCart();

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label={strings.openCartAria}
      className="relative inline-flex size-10 shrink-0 items-center justify-center rounded-[var(--sf-btn-radius)] border border-[var(--sf-border)] bg-[var(--sf-surface)] text-[var(--sf-fg)] transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sf-primary)]"
    >
      <ShoppingBag aria-hidden="true" className="size-5" />
      {count > 0 && (
        <span
          aria-label={strings.cartCountAria}
          className="absolute -top-1.5 -end-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--sf-accent)] px-1 py-0.5 text-xs font-semibold leading-none text-[var(--sf-on-accent)]"
        >
          {count}
        </span>
      )}
    </button>
  );
}
