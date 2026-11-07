"use client";

import Link from "next/link";
import { Dialog as DialogPrimitive } from "radix-ui";
import { ArrowLeft, Minus, Plus, ShoppingCart, Trash2, X } from "lucide-react";
import { BUTTON_CLASSES } from "@/lib/storefront/theme";
import type { StorefrontStrings } from "@/lib/storefront/strings";
import type { CartItem } from "./cart-provider";

/**
 * Apresentação do CARRINHO da vitrine — UI PURA, sem estado de negócio (o
 * estado vive no `CartProvider`: localStorage por loja).
 *
 * O checkout NÃO mora aqui: o botão "Finalizar compra" navega para a rota
 * `/store/{slug}/checkout` (ecrã-cheio no mobile, duas colunas com resumo
 * fixo no desktop — ver `checkout-view.tsx`). Este diálogo fica com o que
 * é dele: lista de itens, quantidades, subtotal e acesso claro ao checkout.
 *
 * Modelo de interação: ECRÃ-CHEIO no mobile (não é uma gaveta lateral) e
 * MODAL CENTRADO grande no desktop (itens à esquerda, resumo à direita).
 * Animações curtas (fade + slide no mobile, fade + escala no desktop),
 * silenciadas por `prefers-reduced-motion` (globals.css).
 */

const SECTION_HEADING_CLASSES =
  "text-xs font-semibold uppercase tracking-wide text-[var(--sf-muted)]";

const BACK_BUTTON_CLASSES =
  "inline-flex h-10 items-center gap-1.5 rounded-[var(--sf-btn-radius)] ps-1 pe-2 text-sm font-medium text-[var(--sf-fg)] transition-opacity hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sf-primary)]";

const STEPPER_BUTTON_CLASSES =
  "inline-flex size-9 items-center justify-center text-[var(--sf-fg)] transition-opacity hover:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--sf-primary)] disabled:opacity-40";

export type CartDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CartItem[];
  count: number;
  subtotal: number;
  /** Sem canal de WhatsApp o checkout nunca se oferece (Fase 1 = WhatsApp). */
  hasChannel: boolean;
  /** Rota do checkout (`/store/{slug}/checkout`). */
  checkoutHref: string;
  increment: (key: string) => void;
  decrement: (key: string) => void;
  remove: (key: string) => void;
  money: (value: number) => string;
  strings: StorefrontStrings;
  dir: "ltr" | "rtl";
};

/** Resumo do pedido — subtotal, entrega (sem taxa inventada) e TOTAL. */
function SummaryRows({
  subtotal,
  money,
  strings,
}: {
  subtotal: number;
  money: (value: number) => string;
  strings: StorefrontStrings;
}) {
  return (
    <div className="space-y-1.5 text-sm">
      <div className="flex items-center justify-between gap-3 text-[var(--sf-muted)]">
        <span>{strings.subtotal}</span>
        <span className="tabular-nums">{money(subtotal)}</span>
      </div>
      <div className="flex items-center justify-between gap-3 text-[var(--sf-muted)]">
        <span>{strings.delivery}</span>
        <span aria-hidden="true">—</span>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-[var(--sf-border)] pt-2.5 text-base font-semibold text-[var(--sf-fg)]">
        <span>{strings.total}</span>
        <span className="tabular-nums">{money(subtotal)}</span>
      </div>
    </div>
  );
}

/** Linha do carrinho: imagem, nome/opções, preço e controlos de quantidade. */
function CartItemRow({
  item,
  money,
  strings,
  increment,
  decrement,
  remove,
}: {
  item: CartItem;
  money: (value: number) => string;
  strings: StorefrontStrings;
  increment: (key: string) => void;
  decrement: (key: string) => void;
  remove: (key: string) => void;
}) {
  return (
    <li className="flex gap-3 py-3.5 first:pt-0 last:pb-0">
      {item.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.imageUrl}
          alt=""
          className="size-16 shrink-0 rounded-[var(--sf-radius)] border border-[var(--sf-border)] object-cover"
        />
      ) : (
        <div className="flex size-16 shrink-0 items-center justify-center rounded-[var(--sf-radius)] border border-[var(--sf-border)] bg-[var(--sf-surface)]">
          <ShoppingCart aria-hidden="true" className="size-6 text-[var(--sf-muted)]" />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium leading-snug">{item.name}</p>
          <button
            type="button"
            onClick={() => remove(item.key)}
            aria-label={`${strings.removeItem}: ${item.name}`}
            className="-me-1 inline-flex size-9 shrink-0 items-center justify-center rounded text-[var(--sf-muted)] transition-colors hover:text-destructive focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--sf-primary)]"
          >
            <Trash2 aria-hidden="true" className="size-4" />
          </button>
        </div>

        {item.options.length > 0 && (
          <ul className="mt-0.5 space-y-0.5">
            {item.options.map((option) => (
              <li
                key={`${option.groupLabel}:${option.choiceLabel}`}
                className="text-xs text-[var(--sf-muted)]"
              >
                {`• ${option.groupLabel}: ${option.choiceLabel}`}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-semibold tabular-nums">
              {money(item.price * item.qty)}
            </span>
            {item.qty > 1 && (
              <span className="text-xs tabular-nums text-[var(--sf-muted)]">
                {`${item.qty} × ${money(item.price)}`}
              </span>
            )}
          </div>

          <div className="inline-flex items-center rounded-[var(--sf-btn-radius)] border border-[var(--sf-border)]">
            <button
              type="button"
              aria-label={`${strings.decreaseQty}: ${item.name}`}
              onClick={() => decrement(item.key)}
              className={STEPPER_BUTTON_CLASSES}
            >
              <Minus aria-hidden="true" className="size-4" />
            </button>
            <span
              className="w-7 text-center text-sm font-medium tabular-nums"
              aria-label={`${strings.itemQuantity}: ${item.qty}`}
            >
              {item.qty}
            </span>
            <button
              type="button"
              aria-label={`${strings.increaseQty}: ${item.name}`}
              onClick={() => increment(item.key)}
              className={STEPPER_BUTTON_CLASSES}
            >
              <Plus aria-hidden="true" className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}

export function CartDialog({
  open,
  onOpenChange,
  items,
  count,
  subtotal,
  hasChannel,
  checkoutHref,
  increment,
  decrement,
  remove,
  money,
  strings,
  dir,
}: CartDialogProps) {
  const close = () => onOpenChange(false);

  const countLabel =
    count === 1
      ? strings.cartItemsOne
      : strings.cartItemsMany.replace("{count}", String(count));

  const checkoutButton = (extraClass = "") => (
    <Link
      href={checkoutHref}
      className={`${BUTTON_CLASSES} ${extraClass}`}
      // O diálogo desmonta com a navegação — sem estado a repor.
      onClick={close}
    >
      {strings.checkout}
    </Link>
  );

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />

        <DialogPrimitive.Content
          dir={dir}
          className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-[var(--sf-bg)] text-[var(--sf-fg)] outline-none data-open:animate-in data-open:fade-in-0 data-open:slide-in-from-bottom-10 data-closed:animate-out data-closed:fade-out-0 data-closed:slide-out-to-bottom-10 md:inset-auto md:left-1/2 md:top-1/2 md:h-auto md:max-h-[min(88dvh,52rem)] md:w-[min(56rem,calc(100%_-_3rem))] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl md:shadow-2xl md:data-open:slide-in-from-bottom-0 md:data-open:zoom-in-95 md:data-closed:slide-out-to-bottom-0 md:data-closed:zoom-out-95"
        >
          <DialogPrimitive.Title className="sr-only">
            {strings.cart}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            {strings.cart}
          </DialogPrimitive.Description>

          {/* ── cabeçalho: voltar (ação primária) + título + contagem + fechar ── */}
          <header className="flex shrink-0 items-center gap-2 border-b border-[var(--sf-border)] px-3 pt-[max(env(safe-area-inset-top),0.75rem)] pb-3 sm:px-4">
            <button
              type="button"
              onClick={close}
              aria-label={strings.continueShopping}
              className={BACK_BUTTON_CLASSES}
            >
              <ArrowLeft aria-hidden="true" className="size-5" />
              <span className="hidden truncate sm:inline">
                {strings.continueShopping}
              </span>
            </button>

            <h2 className="min-w-0 flex-1 truncate text-base font-semibold">
              {strings.cart}
            </h2>

            {count > 0 && (
              <span className="shrink-0 text-sm tabular-nums text-[var(--sf-muted)]">
                {countLabel}
              </span>
            )}

            <DialogPrimitive.Close asChild>
              <button
                type="button"
                aria-label={strings.close}
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-[var(--sf-btn-radius)] text-[var(--sf-muted)] transition-colors hover:text-[var(--sf-fg)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--sf-primary)]"
              >
                <X aria-hidden="true" className="size-5" />
              </button>
            </DialogPrimitive.Close>
          </header>

          {/* ── carrinho ──────────────────────────────────────────────────── */}
          {items.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
              <span className="flex size-14 items-center justify-center rounded-full bg-[var(--sf-surface)]">
                <ShoppingCart
                  aria-hidden="true"
                  className="size-7 text-[var(--sf-muted)]"
                />
              </span>
              <div>
                <p className="text-base font-semibold">{strings.cartEmpty}</p>
                <p className="mt-1 text-sm text-[var(--sf-muted)]">
                  {strings.cartEmptyBody}
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                className={`${BUTTON_CLASSES} mt-2`}
              >
                {strings.exploreProducts}
              </button>
            </div>
          ) : (
            <>
              <div className="flex min-h-0 flex-1 flex-col md:flex-row">
                {/* itens (rolável) */}
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 md:px-6 md:py-5">
                  <ul className="divide-y divide-[var(--sf-border)]">
                    {items.map((item) => (
                      <CartItemRow
                        key={item.key}
                        item={item}
                        money={money}
                        strings={strings}
                        increment={increment}
                        decrement={decrement}
                        remove={remove}
                      />
                    ))}
                  </ul>
                </div>

                {/* resumo — coluna fixa no desktop */}
                <aside className="hidden w-80 shrink-0 flex-col gap-4 border-s border-[var(--sf-border)] px-5 py-5 md:flex">
                  <h3 className={SECTION_HEADING_CLASSES}>
                    {strings.orderSummary}
                  </h3>
                  <SummaryRows
                    subtotal={subtotal}
                    money={money}
                    strings={strings}
                  />
                  {hasChannel && checkoutButton("w-full")}
                  <button
                    type="button"
                    onClick={close}
                    className="text-sm text-[var(--sf-muted)] underline-offset-4 hover:text-[var(--sf-fg)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sf-primary)]"
                  >
                    {strings.continueShopping}
                  </button>
                </aside>
              </div>

              {/* rodapé fixo (mobile): resumo + CTA */}
              <div className="shrink-0 border-t border-[var(--sf-border)] bg-[var(--sf-bg)] px-4 pt-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] md:hidden">
                <SummaryRows
                  subtotal={subtotal}
                  money={money}
                  strings={strings}
                />
                {hasChannel && checkoutButton("mt-3 w-full")}
              </div>
            </>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
