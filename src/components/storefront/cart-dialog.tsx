"use client";

import { type FormEvent, type ReactNode } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import {
  ArrowLeft,
  CheckCircle2,
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/shared/whatsapp-icon";
import { BUTTON_CLASSES } from "@/lib/storefront/theme";
import type { StorefrontStrings } from "@/lib/storefront/strings";
import type { CartItem, CartView, CheckoutForm } from "./cart-provider";

/**
 * Apresentação do carrinho/checkout da vitrine — UI PURA, sem estado de
 * negócio (o estado vive no `CartProvider`: localStorage por loja, formulário
 * em rascunho, envio por WhatsApp).
 *
 * Modelo de interação: ECRÃ-CHEIO no mobile (não é uma gaveta lateral) e
 * MODAL CENTRADO grande no desktop (duas colunas: itens/formulário à
 * esquerda, resumo à direita). O fluxo é uma pilha: **carrinho → checkout →
 * enviado**, com botão "voltar" evidente (seta + rótulo) — o "×" existe
 * apenas como ação secundária.
 *
 * O rodapé (subtotal/entrega/total + CTA) fica fixo no mobile com
 * `env(safe-area-inset-bottom)`; no desktop o mesmo resumo vive na coluna da
 * direita. Animações curtas (fade + slide no mobile, fade + escala no
 * desktop) e silenciadas por `prefers-reduced-motion` (globals.css).
 */

const INPUT_CLASSES =
  "w-full rounded-[var(--sf-btn-radius)] border border-[var(--sf-border)] bg-[var(--sf-bg)] px-3 py-2 text-sm text-[var(--sf-fg)] outline-none placeholder:text-[var(--sf-muted)] focus-visible:ring-2 focus-visible:ring-[var(--sf-primary)]";

const SECTION_HEADING_CLASSES =
  "text-xs font-semibold uppercase tracking-wide text-[var(--sf-muted)]";

const BACK_BUTTON_CLASSES =
  "inline-flex h-10 items-center gap-1.5 rounded-[var(--sf-btn-radius)] ps-1 pe-2 text-sm font-medium text-[var(--sf-fg)] transition-opacity hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sf-primary)]";

const STEPPER_BUTTON_CLASSES =
  "inline-flex size-9 items-center justify-center text-[var(--sf-fg)] transition-opacity hover:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--sf-primary)] disabled:opacity-40";

export type CartDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  view: CartView;
  setView: (view: CartView) => void;
  items: CartItem[];
  count: number;
  subtotal: number;
  /** Sem canal de WhatsApp o checkout nunca se oferece (Fase 1 = WhatsApp). */
  hasChannel: boolean;
  form: CheckoutForm;
  updateForm: (key: keyof CheckoutForm, value: string) => void;
  errors: { name?: string; phone?: string };
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  increment: (key: string) => void;
  decrement: (key: string) => void;
  remove: (key: string) => void;
  money: (value: number) => string;
  strings: StorefrontStrings;
  dir: "ltr" | "rtl";
};

function Field({
  id,
  label,
  required,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
        {required && (
          <span aria-hidden="true" className="text-destructive">
            {" *"}
          </span>
        )}
      </label>
      {children}
      {error && (
        <span
          id={`${id}-err`}
          role="alert"
          className="mt-1 block text-xs text-destructive"
        >
          {error}
        </span>
      )}
    </div>
  );
}

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

/** Reconto compacto do pedido (checkout): produto, quantidade, preço. */
function OrderRecap({
  items,
  money,
  strings,
}: {
  items: CartItem[];
  money: (value: number) => string;
  strings: StorefrontStrings;
}) {
  return (
    <section className="space-y-3">
      <h3 className={SECTION_HEADING_CLASSES}>{strings.yourOrder}</h3>
      <ul className="space-y-2.5">
        {items.map((item) => (
          <li key={item.key} className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{item.name}</p>
              {item.options.length > 0 && (
                <p className="truncate text-xs text-[var(--sf-muted)]">
                  {item.options
                    .map((option) => `${option.groupLabel}: ${option.choiceLabel}`)
                    .join(" · ")}
                </p>
              )}
              <p className="mt-0.5 text-xs tabular-nums text-[var(--sf-muted)]">
                {`${item.qty} × ${money(item.price)}`}
              </p>
            </div>
            <span className="shrink-0 text-sm font-semibold tabular-nums">
              {money(item.price * item.qty)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function CartDialog({
  open,
  onOpenChange,
  view,
  setView,
  items,
  count,
  subtotal,
  hasChannel,
  form,
  updateForm,
  errors,
  onSubmit,
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

  // Voltar: no carrinho sai para a loja; no checkout regressa ao carrinho.
  const backLabel =
    view === "cart" ? strings.continueShopping : strings.cart;
  const handleBack =
    view === "cart" ? close : view === "checkout" ? () => setView("cart") : null;

  const title =
    view === "cart"
      ? strings.cart
      : view === "checkout"
        ? strings.checkout
        : strings.orderSent;

  const checkoutFormId = "sf-checkout";

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />

        <DialogPrimitive.Content
          dir={dir}
          className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-[var(--sf-bg)] text-[var(--sf-fg)] outline-none data-open:animate-in data-open:fade-in-0 data-open:slide-in-from-bottom-10 data-closed:animate-out data-closed:fade-out-0 data-closed:slide-out-to-bottom-10 md:inset-auto md:left-1/2 md:top-1/2 md:h-auto md:max-h-[min(88dvh,52rem)] md:w-[min(56rem,calc(100%_-_3rem))] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl md:shadow-2xl md:data-open:slide-in-from-bottom-0 md:data-open:zoom-in-95 md:data-closed:slide-out-to-bottom-0 md:data-closed:zoom-out-95"
        >
          <DialogPrimitive.Title className="sr-only">
            {title}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            {strings.cart}
          </DialogPrimitive.Description>

          {/* ── cabeçalho: voltar (ação primária) + título + contagem + fechar ── */}
          <header className="flex shrink-0 items-center gap-2 border-b border-[var(--sf-border)] px-3 pt-[max(env(safe-area-inset-top),0.75rem)] pb-3 sm:px-4">
            {handleBack ? (
              <button
                type="button"
                onClick={handleBack}
                aria-label={backLabel}
                className={BACK_BUTTON_CLASSES}
              >
                <ArrowLeft aria-hidden="true" className="size-5" />
                <span className="hidden truncate sm:inline">{backLabel}</span>
              </button>
            ) : (
              <span aria-hidden="true" className="size-10" />
            )}

            <h2 className="min-w-0 flex-1 truncate text-base font-semibold">
              {title}
            </h2>

            {view === "cart" && count > 0 && (
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

          {/* ── vista 1/3: carrinho ───────────────────────────────────────── */}
          {view === "cart" &&
            (items.length === 0 ? (
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
                    {hasChannel && (
                      <button
                        type="button"
                        onClick={() => setView("checkout")}
                        className={`${BUTTON_CLASSES} w-full`}
                      >
                        {strings.checkout}
                      </button>
                    )}
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
                  {hasChannel && (
                    <button
                      type="button"
                      onClick={() => setView("checkout")}
                      className={`${BUTTON_CLASSES} mt-3 w-full`}
                    >
                      {strings.checkout}
                    </button>
                  )}
                </div>
              </>
            ))}

          {/* ── vista 2/3: checkout ───────────────────────────────────────── */}
          {view === "checkout" && (
            <>
              <div className="flex min-h-0 flex-1 flex-col md:flex-row">
                {/* formulário (rolável) */}
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 md:px-6 md:py-5">
                  <form
                    id={checkoutFormId}
                    onSubmit={onSubmit}
                    noValidate
                    className="space-y-5"
                  >
                    {/* reconto — só mobile (no desktop vive no resumo) */}
                    <div className="md:hidden">
                      <OrderRecap
                        items={items}
                        money={money}
                        strings={strings}
                      />
                    </div>

                    <section className="space-y-3 border-t border-[var(--sf-border)] pt-4 md:border-t-0 md:pt-0">
                      <h3 className={SECTION_HEADING_CLASSES}>
                        {strings.customerDetails}
                      </h3>
                      <Field
                        id="sf-name"
                        label={strings.customerName}
                        required
                        error={errors.name}
                      >
                        <input
                          id="sf-name"
                          name="name"
                          type="text"
                          autoComplete="name"
                          required
                          aria-required="true"
                          aria-invalid={Boolean(errors.name)}
                          aria-describedby={errors.name ? "sf-name-err" : undefined}
                          value={form.name}
                          onChange={(event) =>
                            updateForm("name", event.target.value)
                          }
                          className={INPUT_CLASSES}
                        />
                      </Field>
                      <Field
                        id="sf-phone"
                        label={strings.customerPhone}
                        required
                        error={errors.phone}
                      >
                        <input
                          id="sf-phone"
                          name="phone"
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel"
                          required
                          aria-required="true"
                          aria-invalid={Boolean(errors.phone)}
                          aria-describedby={
                            errors.phone ? "sf-phone-err" : undefined
                          }
                          value={form.phone}
                          onChange={(event) =>
                            updateForm("phone", event.target.value)
                          }
                          className={INPUT_CLASSES}
                        />
                      </Field>
                    </section>

                    <section className="space-y-3 border-t border-[var(--sf-border)] pt-4">
                      <h3 className={SECTION_HEADING_CLASSES}>
                        {strings.delivery}
                      </h3>
                      <Field id="sf-address" label={strings.deliveryAddress}>
                        <input
                          id="sf-address"
                          name="address"
                          type="text"
                          autoComplete="street-address"
                          value={form.address}
                          onChange={(event) =>
                            updateForm("address", event.target.value)
                          }
                          className={INPUT_CLASSES}
                        />
                      </Field>
                      <Field id="sf-neighborhood" label={strings.neighborhood}>
                        <input
                          id="sf-neighborhood"
                          name="neighborhood"
                          type="text"
                          autoComplete="address-level2"
                          value={form.neighborhood}
                          onChange={(event) =>
                            updateForm("neighborhood", event.target.value)
                          }
                          className={INPUT_CLASSES}
                        />
                      </Field>
                      <Field id="sf-reference" label={strings.referencePoint}>
                        <input
                          id="sf-reference"
                          name="reference"
                          type="text"
                          value={form.reference}
                          onChange={(event) =>
                            updateForm("reference", event.target.value)
                          }
                          className={INPUT_CLASSES}
                        />
                      </Field>
                    </section>

                    <section className="space-y-3 border-t border-[var(--sf-border)] pt-4">
                      <h3 className={SECTION_HEADING_CLASSES}>
                        {strings.paymentMethod}
                      </h3>
                      <select
                        id="sf-payment"
                        name="payment"
                        aria-label={strings.paymentMethod}
                        value={form.payment}
                        onChange={(event) =>
                          updateForm("payment", event.target.value)
                        }
                        className={INPUT_CLASSES}
                      >
                        <option value="">—</option>
                        <option value="cash">{strings.paymentCash}</option>
                        <option value="transfer">{strings.paymentTransfer}</option>
                        <option value="other">{strings.paymentOther}</option>
                      </select>
                    </section>

                    <section className="space-y-3 border-t border-[var(--sf-border)] pt-4">
                      <h3 className={SECTION_HEADING_CLASSES}>
                        {strings.orderNotes}
                      </h3>
                      <textarea
                        id="sf-notes"
                        name="notes"
                        rows={3}
                        aria-label={strings.orderNotes}
                        value={form.notes}
                        onChange={(event) =>
                          updateForm("notes", event.target.value)
                        }
                        className={`${INPUT_CLASSES} resize-y`}
                      />
                    </section>
                  </form>
                </div>

                {/* resumo — coluna fixa no desktop */}
                <aside className="hidden w-80 shrink-0 flex-col gap-4 border-s border-[var(--sf-border)] px-5 py-5 md:flex">
                  <OrderRecap items={items} money={money} strings={strings} />
                  <div className="border-t border-[var(--sf-border)] pt-4">
                    <SummaryRows
                      subtotal={subtotal}
                      money={money}
                      strings={strings}
                    />
                  </div>
                  <p className="text-xs text-[var(--sf-muted)]">
                    {strings.checkoutNote}
                  </p>
                  <button
                    type="submit"
                    form={checkoutFormId}
                    className={`${BUTTON_CLASSES} w-full`}
                  >
                    <WhatsAppIcon className="size-4" />
                    {strings.orderWhatsApp}
                  </button>
                </aside>
              </div>

              {/* rodapé fixo (mobile): resumo + CTA WhatsApp */}
              <div className="shrink-0 border-t border-[var(--sf-border)] bg-[var(--sf-bg)] px-4 pt-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] md:hidden">
                <SummaryRows
                  subtotal={subtotal}
                  money={money}
                  strings={strings}
                />
                <button
                  type="submit"
                  form={checkoutFormId}
                  className={`${BUTTON_CLASSES} mt-3 w-full`}
                >
                  <WhatsAppIcon className="size-4" />
                  {strings.orderWhatsApp}
                </button>
              </div>
            </>
          )}

          {/* ── vista 3/3: enviado ────────────────────────────────────────── */}
          {view === "sent" && (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
              <CheckCircle2
                aria-hidden="true"
                className="size-10 text-[var(--sf-primary)]"
              />
              <p className="text-base font-semibold">{strings.orderSent}</p>
              <p className="max-w-sm text-sm text-[var(--sf-muted)]">
                {strings.checkoutNote}
              </p>
              <button
                type="button"
                onClick={close}
                className={`${BUTTON_CLASSES} mt-2`}
              >
                {strings.continueShopping}
              </button>
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
