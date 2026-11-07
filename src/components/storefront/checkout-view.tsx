"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  MapPin,
  ShoppingCart,
  User,
  Wallet,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/shared/whatsapp-icon";
import { BUTTON_CLASSES } from "@/lib/storefront/theme";
import type { StorefrontStrings } from "@/lib/storefront/strings";
import { useCart, type CartItem } from "./cart-provider";
import { useCheckout, type CheckoutContextValue } from "./checkout-provider";

/**
 * Checkout da vitrine — superfície SÓLIDA de ecommerce, não um overlay.
 *
 * Esta é a UI da rota `/store/{slug}/checkout` (o diálogo do carrinho só
 * apresenta o carrinho): no MOBILE é um ecrã único e organizado (voltar,
 * título, secções, resumo e barra fixa com o CTA); no DESKTOP são duas
 * colunas — formulário à esquerda, RESUMO FIXO (sticky) à direita.
 *
 * Regras visuais (a razão deste rebuild):
 *  • cartões e campos com cor SÓLIDA derivada do tema (`--sf-card`,
 *    `--sf-input-bg`) — nunca translúcidos nem a fundir com a página;
 *  • labels sempre visíveis acima do campo (o placeholder é secundário);
 *  • foco, erro e estado selecionado inequívocos;
 *  • TOTAL destacado e CTA do WhatsApp sempre ao alcance (barra fixa no
 *    mobile, coluna fixa no desktop), desabilitado enquanto faltam dados
 *    obrigatórios — com aviso explícito do que falta.
 *
 * Nada de lógica nova de negócio aqui: itens, subtotal, validação, envio e
 * mensagem vêm do `useCart`/`useCheckout` (mesmos módulos de sempre).
 */

// ── estilos locais (contraste garantido em qualquer tema da loja) ─────────

const CARD_CLASSES =
  "rounded-[var(--sf-radius)] border border-[var(--sf-card-border)] bg-[var(--sf-card)] p-4 shadow-sm sm:p-5";

const SECTION_TITLE_CLASSES =
  "mb-4 flex items-center gap-2 text-base font-semibold text-[var(--sf-fg)]";

function inputClasses(hasError: boolean): string {
  return [
    "w-full rounded-[var(--sf-btn-radius)] border bg-[var(--sf-input-bg)]",
    "px-3.5 py-3 text-base text-[var(--sf-fg)] outline-none",
    "placeholder:text-[var(--sf-muted)]",
    "focus-visible:ring-2 focus-visible:ring-[var(--sf-primary)]",
    hasError
      ? "border-destructive"
      : "border-[var(--sf-input-border)] focus-visible:border-[var(--sf-primary)]",
  ].join(" ");
}

// ── peças reutilizáveis ───────────────────────────────────────────────────

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
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-medium text-[var(--sf-fg)]"
      >
        {label}
        {required && (
          <span aria-hidden="true" className="ms-0.5 text-destructive">
            {" *"}
          </span>
        )}
      </label>
      {children}
      {error && (
        <p
          id={`${id}-err`}
          role="alert"
          className="mt-1.5 text-sm text-destructive"
        >
          {error}
        </p>
      )}
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className={CARD_CLASSES}>
      <h2 className={SECTION_TITLE_CLASSES}>
        <span aria-hidden="true" className="text-[var(--sf-primary)]">
          {icon}
        </span>
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

/** Linhas de valores: subtotal, entrega (sem taxa inventada) e TOTAL. */
function SummaryTotals({
  subtotal,
  money,
  strings,
}: {
  subtotal: number;
  money: (value: number) => string;
  strings: StorefrontStrings;
}) {
  return (
    <div className="mt-4 space-y-2 border-t border-[var(--sf-card-border)] pt-4 text-sm">
      <div className="flex items-center justify-between gap-3 text-[var(--sf-muted)]">
        <span>{strings.subtotal}</span>
        <span className="tabular-nums">{money(subtotal)}</span>
      </div>
      <div className="flex items-center justify-between gap-3 text-[var(--sf-muted)]">
        <span>{strings.delivery}</span>
        <span aria-hidden="true">—</span>
      </div>
      <div className="flex items-center justify-between gap-3 pt-1">
        <span className="text-base font-semibold text-[var(--sf-fg)]">
          {strings.total}
        </span>
        <span className="text-xl font-bold tabular-nums text-[var(--sf-fg)]">
          {money(subtotal)}
        </span>
      </div>
    </div>
  );
}

/** Item do reconto: miniatura, nome, quantidade e preço da linha. */
function SummaryItem({
  item,
  money,
}: {
  item: CartItem;
  money: (value: number) => string;
}) {
  return (
    <li className="flex items-start gap-3">
      {item.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.imageUrl}
          alt=""
          className="size-10 shrink-0 rounded-[var(--sf-radius)] border border-[var(--sf-card-border)] object-cover"
        />
      ) : (
        <div className="flex size-10 shrink-0 items-center justify-center rounded-[var(--sf-radius)] border border-[var(--sf-card-border)] bg-[var(--sf-surface)]">
          <ShoppingCart
            aria-hidden="true"
            className="size-4 text-[var(--sf-muted)]"
          />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium break-words">{item.name}</p>
        {item.options.length > 0 && (
          <p className="mt-0.5 text-xs break-words text-[var(--sf-muted)]">
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
  );
}

/**
 * CTA do WhatsApp + avisos. `idPrefix` evita IDs duplicados (o mesmo bloco
 * existe na coluna fixa do desktop e na barra fixa do mobile — só um fica
 * visível por vez).
 */
function WhatsAppCta({
  checkout,
  strings,
  idPrefix,
  showNote = true,
}: {
  checkout: CheckoutContextValue;
  strings: StorefrontStrings;
  idPrefix: string;
  showNote?: boolean;
}) {
  const hintId = `${idPrefix}-required-hint`;
  return (
    <div>
      <button
        type="submit"
        form="sf-checkout-form"
        disabled={!checkout.canSubmit}
        aria-describedby={checkout.canSubmit ? undefined : hintId}
        className={`${BUTTON_CLASSES} min-h-12 w-full`}
      >
        <WhatsAppIcon className="size-5" />
        {strings.orderWhatsApp}
      </button>

      {!checkout.canSubmit && (
        <p
          id={hintId}
          className="mt-2 text-center text-sm text-[var(--sf-muted)]"
        >
          {strings.checkoutRequired}
        </p>
      )}

      {checkout.orderError && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {checkout.orderError}
        </p>
      )}

      {showNote && (
        <p className="mt-2 text-center text-sm text-[var(--sf-muted)]">
          {strings.checkoutNote}
        </p>
      )}
    </div>
  );
}

const PAYMENT_OPTIONS = [
  { value: "cash", labelKey: "paymentCash" },
  { value: "transfer", labelKey: "paymentTransfer" },
  { value: "other", labelKey: "paymentOther" },
] as const;

// ── vistas ────────────────────────────────────────────────────────────────

function Confirmation({
  strings,
  storeHref,
}: {
  strings: StorefrontStrings;
  storeHref: string;
}) {
  return (
    <div className="mx-auto max-w-md">
      <div className={`${CARD_CLASSES} text-center`}>
        <CheckCircle2
          aria-hidden="true"
          className="mx-auto size-10 text-[var(--sf-primary)]"
        />
        <h1 className="mt-3 text-lg font-semibold">{strings.orderSent}</h1>
        <p className="mt-1.5 text-sm text-[var(--sf-muted)]">
          {strings.checkoutNote}
        </p>
        <Link href={storeHref} className={`${BUTTON_CLASSES} mt-5`}>
          {strings.continueShopping}
        </Link>
      </div>
    </div>
  );
}

function EmptyCart({
  strings,
  storeHref,
}: {
  strings: StorefrontStrings;
  storeHref: string;
}) {
  return (
    <div className="mx-auto max-w-md">
      <div className={`${CARD_CLASSES} text-center`}>
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-[var(--sf-surface)]">
          <ShoppingCart
            aria-hidden="true"
            className="size-7 text-[var(--sf-muted)]"
          />
        </span>
        <p className="mt-3 text-base font-semibold">{strings.cartEmpty}</p>
        <p className="mt-1 text-sm text-[var(--sf-muted)]">
          {strings.cartEmptyBody}
        </p>
        <Link href={storeHref} className={`${BUTTON_CLASSES} mt-5`}>
          {strings.exploreProducts}
        </Link>
      </div>
    </div>
  );
}

export function CheckoutView({
  storeSlug,
  strings,
}: {
  storeSlug: string;
  strings: StorefrontStrings;
}) {
  const { items, subtotal } = useCart();
  const checkout = useCheckout();
  const storeHref = `/store/${storeSlug}`;

  if (checkout.sent) {
    return <Confirmation strings={strings} storeHref={storeHref} />;
  }

  if (items.length === 0) {
    return <EmptyCart strings={strings} storeHref={storeHref} />;
  }

  const { form, errors, update, blur } = checkout;

  return (
    <div className="pb-2">
      {/* voltar + título (mobile e desktop) */}
      <div className="mb-5">
        <Link
          href={storeHref}
          className="inline-flex h-10 items-center gap-1.5 rounded-[var(--sf-btn-radius)] ps-1 pe-2 text-sm font-medium text-[var(--sf-fg)] transition-opacity hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sf-primary)]"
        >
          <ArrowLeft aria-hidden="true" className="size-5" />
          {strings.backToStore}
        </Link>
        <h1 className="mt-1.5 text-xl font-semibold sm:text-2xl">
          {strings.checkout}
        </h1>
      </div>

      <div className="grid items-start gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_21rem] xl:grid-cols-[minmax(0,1fr)_24rem]">
        {/* ── coluna 1: dados do cliente + entrega + pagamento ─────────── */}
        <form
          id="sf-checkout-form"
          onSubmit={checkout.submit}
          noValidate
          className="space-y-4 sm:space-y-5"
        >
          <Section icon={<User className="size-4" />} title={strings.customerDetails}>
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
                onChange={(event) => update("name", event.target.value)}
                onBlur={() => blur("name")}
                className={inputClasses(Boolean(errors.name))}
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
                aria-describedby={errors.phone ? "sf-phone-err" : undefined}
                value={form.phone}
                onChange={(event) => update("phone", event.target.value)}
                onBlur={() => blur("phone")}
                className={inputClasses(Boolean(errors.phone))}
              />
            </Field>
          </Section>

          <Section icon={<MapPin className="size-4" />} title={strings.delivery}>
            <Field
              id="sf-neighborhood"
              label={strings.neighborhood}
              required
              error={errors.neighborhood}
            >
              <input
                id="sf-neighborhood"
                name="neighborhood"
                type="text"
                autoComplete="address-level2"
                required
                aria-required="true"
                aria-invalid={Boolean(errors.neighborhood)}
                aria-describedby={
                  errors.neighborhood ? "sf-neighborhood-err" : undefined
                }
                value={form.neighborhood}
                onChange={(event) => update("neighborhood", event.target.value)}
                onBlur={() => blur("neighborhood")}
                className={inputClasses(Boolean(errors.neighborhood))}
              />
            </Field>

            <Field id="sf-address" label={strings.deliveryAddress}>
              <input
                id="sf-address"
                name="address"
                type="text"
                autoComplete="street-address"
                value={form.address}
                onChange={(event) => update("address", event.target.value)}
                className={inputClasses(false)}
              />
            </Field>

            <Field id="sf-reference" label={strings.referencePoint}>
              <input
                id="sf-reference"
                name="reference"
                type="text"
                value={form.reference}
                onChange={(event) => update("reference", event.target.value)}
                className={inputClasses(false)}
              />
            </Field>

            <Field id="sf-notes" label={strings.orderNotes}>
              <textarea
                id="sf-notes"
                name="notes"
                rows={3}
                value={form.notes}
                onChange={(event) => update("notes", event.target.value)}
                className={`${inputClasses(false)} resize-y`}
              />
            </Field>
          </Section>

          <Section
            icon={<Wallet className="size-4" />}
            title={strings.paymentMethod}
          >
            <div
              role="radiogroup"
              aria-label={strings.paymentMethod}
              className="grid gap-2.5 sm:grid-cols-3"
            >
              {PAYMENT_OPTIONS.map((option) => {
                const selected = form.payment === option.value;
                return (
                  <label
                    key={option.value}
                    className={[
                      "flex cursor-pointer items-center gap-2.5 rounded-[var(--sf-btn-radius)]",
                      "border px-3.5 py-3 text-sm font-medium text-[var(--sf-fg)]",
                      "transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--sf-primary)]",
                      selected
                        ? "border-[var(--sf-primary)] bg-[var(--sf-input-bg)] ring-2 ring-[var(--sf-primary)]"
                        : "border-[var(--sf-input-border)] bg-[var(--sf-input-bg)] hover:bg-[var(--sf-surface)]",
                    ].join(" ")}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={option.value}
                      checked={selected}
                      onChange={() => update("payment", option.value)}
                      className="size-4 shrink-0 accent-[var(--sf-primary)]"
                    />
                    <span className="min-w-0">{strings[option.labelKey]}</span>
                  </label>
                );
              })}
            </div>
          </Section>
        </form>

        {/* ── coluna 2: resumo do pedido (fixo no desktop) ─────────────── */}
        <aside className="lg:sticky lg:top-6">
          <div className={CARD_CLASSES}>
            <h2 className={SECTION_TITLE_CLASSES}>
              <span aria-hidden="true" className="text-[var(--sf-primary)]">
                <ShoppingCart className="size-4" />
              </span>
              {strings.orderSummary}
            </h2>

            <ul className="space-y-3">
              {items.map((item) => (
                <SummaryItem
                  key={item.key}
                  item={item}
                  money={checkout.money}
                />
              ))}
            </ul>

            <SummaryTotals
              subtotal={subtotal}
              money={checkout.money}
              strings={strings}
            />

            {/* nota de rodapé (mobile: no resumo; desktop: no CTA) */}
            <p className="mt-3 text-center text-sm text-[var(--sf-muted)] lg:hidden">
              {strings.checkoutNote}
            </p>

            {/* CTA completo — apenas no desktop (no mobile a barra fixa) */}
            <div className="mt-4 hidden lg:block">
              <WhatsAppCta
                checkout={checkout}
                strings={strings}
                idPrefix="sf-desk"
              />
            </div>
          </div>
        </aside>
      </div>

      {/* ── barra fixa (mobile): total + CTA sempre ao alcance ─────────── */}
      <div className="sticky bottom-0 z-30 -mx-4 mt-4 border-t border-[var(--sf-card-border)] bg-[var(--sf-bg)] px-4 pt-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] sm:-mx-6 sm:px-6 lg:hidden">
        <div className="mb-2.5 flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-[var(--sf-fg)]">
            {strings.total}
          </span>
          <span className="text-lg font-bold tabular-nums text-[var(--sf-fg)]">
            {checkout.money(subtotal)}
          </span>
        </div>
        <WhatsAppCta
          checkout={checkout}
          strings={strings}
          idPrefix="sf-mob"
          showNote={false}
        />
      </div>
    </div>
  );
}
