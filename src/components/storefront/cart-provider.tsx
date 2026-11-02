"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/shared/whatsapp-icon";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatCurrency } from "@/lib/currency";
import type { Locale } from "@/lib/i18n/config";
import type { PublicProduct } from "@/lib/catalog/types";
import { BUTTON_CLASSES } from "@/lib/storefront/theme";
import type { StorefrontStrings } from "@/lib/storefront/strings";
import { buildOrderMessage } from "@/lib/storefront/order-message";
import {
  optionsSignature,
  selectedOptionsPrice,
  type SelectedOption,
} from "@/lib/storefront/product-options";

/**
 * Carrinho da vitrine — estado CLIENTE persistido em localStorage, por loja.
 *
 * Sem servidor de carrinho: o visitante monta o pedido e envia-o por
 * WhatsApp (o canal de encomendas previsto pela Fase 1). Nada de pagamentos,
 * sessão ou tabelas.
 *
 * Fluxo do sheet: **carrinho → checkout → enviado**. O checkout é um
 * formulário SEM conta (nome, contacto, morada, notas, pagamento) e a
 * mensagem final é a ESTRUTURADA construída por `buildOrderMessage`
 * (testada em `order-message.test.ts`). A entrega fica preparada para taxas
 * futuras: `deliveryFee` entra na mensagem como linha extra, mas hoje é
 * sempre `null` (nenhuma zona/taxa é calculada).
 *
 * A hidratação usa `useSyncExternalStore` (padrão React para stores
 * externos): o snapshot do servidor é vazio, o cliente lê o localStorage
 * e o HTML nunca diverge durante a hidratação.
 */

export type CartItem = {
  /** Identidade da linha: produto + opções escolhidas. */
  key: string;
  /** Id do produto (para referência/debug no storage). */
  id: string;
  name: string;
  /** Preço UNITÁRIO, já com o acréscimo das opções escolhidas. */
  price: number;
  imageUrl: string | null;
  qty: number;
  options: SelectedOption[];
};

const EMPTY_ITEMS: CartItem[] = [];

function storageKey(storeId: string): string {
  return `elicani:cart:${storeId}`;
}

function sanitizeOptions(raw: unknown): SelectedOption[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (option): option is SelectedOption =>
      typeof option === "object" &&
      option !== null &&
      typeof option.groupLabel === "string" &&
      typeof option.choiceLabel === "string" &&
      typeof option.priceDelta === "number",
  );
}

function sanitizeItems(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];
  const items: CartItem[] = [];
  for (const entry of raw) {
    if (typeof entry !== "object" || entry === null) continue;
    const item = entry as Partial<CartItem>;
    if (
      typeof item.id !== "string" ||
      typeof item.name !== "string" ||
      typeof item.price !== "number" ||
      typeof item.qty !== "number"
    ) {
      continue;
    }
    items.push({
      // Itens antigos (antes das opções) não tinham `key` → id do produto.
      key: typeof item.key === "string" && item.key ? item.key : item.id,
      id: item.id,
      name: item.name,
      price: item.price,
      imageUrl: typeof item.imageUrl === "string" ? item.imageUrl : null,
      qty: item.qty,
      options: sanitizeOptions(item.options),
    });
  }
  return items;
}

/** Store externo por loja — um carrinho por tenant, sem contexto React. */
class CartStore {
  readonly storeId: string;
  items: CartItem[] = EMPTY_ITEMS;
  private hydrated = false;
  private listeners = new Set<() => void>();

  constructor(storeId: string) {
    this.storeId = storeId;
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (): CartItem[] => {
    if (!this.hydrated) {
      // Leitura única do localStorage no primeiro snapshot do cliente.
      try {
        const raw = globalThis.localStorage?.getItem(storageKey(this.storeId));
        this.items = raw ? sanitizeItems(JSON.parse(raw)) : EMPTY_ITEMS;
      } catch {
        this.items = EMPTY_ITEMS;
      }
      this.hydrated = true;
    }
    return this.items;
  };

  getServerSnapshot = (): CartItem[] => EMPTY_ITEMS;

  private set(next: CartItem[]) {
    this.items = next;
    try {
      globalThis.localStorage?.setItem(
        storageKey(this.storeId),
        JSON.stringify(next),
      );
    } catch {
      // Storage cheio/bloqueado: o carrinho continua em memória.
    }
    for (const listener of this.listeners) listener();
  }

  add(
    product: PublicProduct,
    options: readonly SelectedOption[] = [],
    qty = 1,
  ) {
    if (!product.is_available || qty < 1) return;
    const current = this.getSnapshot();
    const signature = optionsSignature(options);
    const key = signature ? `${product.id}::${signature}` : product.id;
    const existing = current.find((item) => item.key === key);
    if (existing) {
      this.set(
        current.map((item) =>
          item.key === key ? { ...item, qty: item.qty + qty } : item,
        ),
      );
      return;
    }
    this.set([
      ...current,
      {
        key,
        id: product.id,
        name: product.name,
        price:
          (product.promo_price ?? product.price) +
          selectedOptionsPrice(options),
        imageUrl: product.image_url,
        qty,
        options: [...options],
      },
    ]);
  }

  increment(key: string) {
    this.set(
      this.getSnapshot().map((item) =>
        item.key === key ? { ...item, qty: item.qty + 1 } : item,
      ),
    );
  }

  decrement(key: string) {
    this.set(
      this.getSnapshot().flatMap((item) =>
        item.key === key
          ? item.qty > 1
            ? [{ ...item, qty: item.qty - 1 }]
            : []
          : [item],
      ),
    );
  }

  remove(key: string) {
    this.set(this.getSnapshot().filter((item) => item.key !== key));
  }
}

const cartStores = new Map<string, CartStore>();

function getCartStore(storeId: string): CartStore {
  let store = cartStores.get(storeId);
  if (!store) {
    store = new CartStore(storeId);
    cartStores.set(storeId, store);
  }
  return store;
}

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  open: boolean;
  setOpen: (open: boolean) => void;
  add: (
    product: PublicProduct,
    options?: readonly SelectedOption[],
    qty?: number,
  ) => void;
  increment: (key: string) => void;
  decrement: (key: string) => void;
  remove: (key: string) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

/** Hook de contexto — erro claro se o provider faltar. */
export function useCart(): CartContextValue {
  const value = useContext(CartContext);
  if (!value) {
    throw new Error("useCart must be used inside <CartProvider>");
  }
  return value;
}

/**
 * Contexto OPCIONAL — o preview do painel renderiza os mesmos componentes
 * sem provider de carrinho; aqui `null` significa "modo somente leitura".
 */
export function useOptionalCart(): CartContextValue | null {
  return useContext(CartContext);
}

// ── estilos locais do formulário de checkout ──────────────────────────────
const INPUT_CLASSES =
  "w-full rounded-[var(--sf-btn-radius)] border border-[var(--sf-border)] bg-[var(--sf-bg)] px-3 py-2 text-sm text-[var(--sf-fg)] outline-none placeholder:text-[var(--sf-muted)] focus-visible:ring-2 focus-visible:ring-[var(--sf-primary)]";

type CheckoutForm = {
  name: string;
  phone: string;
  address: string;
  neighborhood: string;
  reference: string;
  notes: string;
  payment: string;
};

const EMPTY_FORM: CheckoutForm = {
  name: "",
  phone: "",
  address: "",
  neighborhood: "",
  reference: "",
  notes: "",
  payment: "",
};

type SheetView = "cart" | "checkout" | "sent";

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
        <span id={`${id}-err`} role="alert" className="mt-1 block text-xs text-destructive">
          {error}
        </span>
      )}
    </div>
  );
}

export function CartProvider({
  storeId,
  storeName,
  whatsappNumber,
  currency,
  locale,
  strings,
  children,
}: {
  storeId: string;
  storeName: string;
  whatsappNumber: string | null;
  currency: string;
  locale: Locale;
  strings: StorefrontStrings;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<SheetView>("cart");
  const [form, setForm] = useState<CheckoutForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const cartStore = useMemo(() => getCartStore(storeId), [storeId]);

  const items = useSyncExternalStore(
    cartStore.subscribe,
    cartStore.getSnapshot,
    cartStore.getServerSnapshot,
  );

  const add = useCallback(
    (product: PublicProduct, options?: readonly SelectedOption[], qty?: number) =>
      cartStore.add(product, options, qty),
    [cartStore],
  );
  const increment = useCallback(
    (key: string) => cartStore.increment(key),
    [cartStore],
  );
  const decrement = useCallback(
    (key: string) => cartStore.decrement(key),
    [cartStore],
  );
  const remove = useCallback(
    (key: string) => cartStore.remove(key),
    [cartStore],
  );

  const handleOpenChange = useCallback((next: boolean) => {
    setOpen(next);
    if (!next) {
      setView("cart");
      setErrors({});
      // O formulário é preservado ao fechar a meio do checkout (rascunho do
      // visitante); só um envio bem-sucedido o limpa (ver `sendOrder`).
    }
  }, []);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((total, item) => total + item.qty, 0);
    const subtotal = items.reduce(
      (total, item) => total + item.price * item.qty,
      0,
    );
    return {
      items,
      count,
      subtotal,
      open,
      setOpen: handleOpenChange,
      add,
      increment,
      decrement,
      remove,
    };
  }, [items, open, handleOpenChange, add, increment, decrement, remove]);

  const subtotal = value.subtotal;
  const whatsappDigits = whatsappNumber?.replace(/\D/g, "") ?? "";
  const hasChannel = whatsappDigits.length >= 7;

  const updateForm = (key: keyof CheckoutForm, next: string) =>
    setForm((current) => ({ ...current, [key]: next }));

  const paymentLabel =
    form.payment === "cash"
      ? strings.paymentCash
      : form.payment === "transfer"
        ? strings.paymentTransfer
        : form.payment === "other"
          ? strings.paymentOther
          : "";

  const sendOrder = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!hasChannel) return;

    const nextErrors: { name?: string; phone?: string } = {};
    if (!form.name.trim()) nextErrors.name = strings.nameRequired;
    if (form.phone.replace(/\D/g, "").length < 7) {
      nextErrors.phone = strings.phoneRequired;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const message = buildOrderMessage({
      storeName,
      lines: items.map((item) => ({
        name: item.name,
        qty: item.qty,
        unitPrice: item.price,
        options: item.options,
      })),
      subtotal,
      // Sem taxas de entrega hoje — a linha aparece quando existirem.
      deliveryFee: null,
      customer: {
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim() || undefined,
        neighborhood: form.neighborhood.trim() || undefined,
        reference: form.reference.trim() || undefined,
        notes: form.notes || undefined,
        payment: paymentLabel || undefined,
      },
      currency,
      locale,
      strings,
    });

    window.open(
      `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer",
    );
    // Pedido enviado → formulário limpo para a próxima compra.
    setForm(EMPTY_FORM);
    setView("sent");
  };

  // Sem canal de WhatsApp o carrinho nunca oferece checkout (a Fase 1 é
  // por WhatsApp) — mesma semântica de sempre: nenhum botão de envio.
  const activeView: SheetView =
    items.length === 0 && view !== "cart" ? "cart" : view;

  const money = (value: number) => formatCurrency(value, currency, locale);

  return (
    <CartContext.Provider value={value}>
      {children}

      <Sheet open={open} onOpenChange={handleOpenChange}>
        {/* gatilho flutuante (canto inferior final) */}
        <button
          type="button"
          onClick={() => handleOpenChange(true)}
          className={`${BUTTON_CLASSES} fixed bottom-4 end-4 z-40 shadow-lg sm:bottom-6 sm:end-6`}
          aria-label={strings.openCartAria}
        >
          <ShoppingBag aria-hidden="true" className="size-4" />
          {strings.cart}
          {value.count > 0 && (
            <span
              className="ms-1 inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--sf-accent)] px-1 py-0.5 text-xs font-semibold text-[var(--sf-on-accent)]"
              aria-label={strings.cartCountAria}
            >
              {value.count}
            </span>
          )}
        </button>

        <SheetContent side="right" className="flex w-full flex-col sm:max-w-sm">
          <SheetHeader>
            <SheetTitle>
              {activeView === "cart"
                ? strings.cart
                : activeView === "checkout"
                  ? strings.checkout
                  : strings.orderSent}
            </SheetTitle>
            <SheetDescription className="sr-only">
              {strings.cart}
            </SheetDescription>
          </SheetHeader>

          {/* ── vista 1/3: carrinho ─────────────────────────────────── */}
          {activeView === "cart" &&
            (items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
                <ShoppingBag
                  aria-hidden="true"
                  className="size-8 text-muted-foreground"
                />
                <p className="text-sm font-medium">{strings.cartEmpty}</p>
                <p className="text-sm text-muted-foreground">
                  {strings.cartEmptyBody}
                </p>
              </div>
            ) : (
              <>
                <ul className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                  {items.map((item) => (
                    <li key={item.key} className="flex items-start gap-3">
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.imageUrl}
                          alt=""
                          className="size-14 shrink-0 rounded-md border border-border/70 object-cover"
                        />
                      ) : (
                        <div className="flex size-14 shrink-0 items-center justify-center rounded-md border border-border/70 bg-muted/40">
                          <ShoppingBag
                            aria-hidden="true"
                            className="size-4 text-muted-foreground"
                          />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium leading-snug">
                          {item.name}
                        </p>

                        {item.options.length > 0 && (
                          <ul className="mt-0.5 space-y-0.5">
                            {item.options.map((option) => (
                              <li
                                key={`${option.groupLabel}:${option.choiceLabel}`}
                                className="text-xs text-muted-foreground"
                              >
                                {`• ${option.groupLabel}: ${option.choiceLabel}`}
                              </li>
                            ))}
                          </ul>
                        )}

                        {/* preço unitário + subtotal da linha */}
                        <div className="mt-1 flex items-baseline justify-between gap-2 text-sm">
                          <span className="tabular-nums text-muted-foreground">
                            {item.qty} × {money(item.price)}
                          </span>
                          <span className="font-semibold tabular-nums">
                            {money(item.price * item.qty)}
                          </span>
                        </div>

                        <div className="mt-1.5 flex items-center gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon-sm"
                            aria-label={`${strings.decreaseQty}: ${item.name}`}
                            onClick={() => decrement(item.key)}
                          >
                            <Minus aria-hidden="true" className="size-3.5" />
                          </Button>
                          <span
                            className="w-6 text-center text-sm tabular-nums"
                            aria-label={`${strings.itemQuantity}: ${item.qty}`}
                          >
                            {item.qty}
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon-sm"
                            aria-label={`${strings.increaseQty}: ${item.name}`}
                            onClick={() => increment(item.key)}
                          >
                            <Plus aria-hidden="true" className="size-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="ms-auto text-muted-foreground hover:text-destructive"
                            aria-label={`${strings.removeItem}: ${item.name}`}
                            onClick={() => remove(item.key)}
                          >
                            <Trash2 aria-hidden="true" className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="space-y-3 border-t border-border/70 px-4 py-4">
                  <div className="flex items-center justify-between text-sm font-semibold">
                    <span>{strings.subtotal}</span>
                    <span>{money(subtotal)}</span>
                  </div>

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
                    onClick={() => handleOpenChange(false)}
                    className="w-full py-1 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  >
                    {strings.continueShopping}
                  </button>
                </div>
              </>
            ))}

          {/* ── vista 2/3: checkout ─────────────────────────────────── */}
          {activeView === "checkout" && (
            <>
              <div className="flex-1 overflow-y-auto px-4 py-4">
                <button
                  type="button"
                  onClick={() => setView("cart")}
                  className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  <ArrowLeft aria-hidden="true" className="size-4" />
                  {strings.cart}
                </button>

                <form
                  id="sf-checkout"
                  onSubmit={sendOrder}
                  noValidate
                  className="space-y-4"
                >
                  <Field id="sf-name" label={strings.customerName} required error={errors.name}>
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
                      onChange={(event) => updateForm("name", event.target.value)}
                      className={INPUT_CLASSES}
                    />
                  </Field>

                  <Field id="sf-phone" label={strings.customerPhone} required error={errors.phone}>
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
                      onChange={(event) => updateForm("phone", event.target.value)}
                      className={INPUT_CLASSES}
                    />
                  </Field>

                  {/* morada agrupada — pronta para taxas/zonas de entrega futuras */}
                  <fieldset className="rounded-[var(--sf-btn-radius)] border border-border/70 px-3 pb-3 pt-1.5">
                    <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {strings.delivery}
                    </legend>
                    <div className="space-y-3 pt-1.5">
                      <Field id="sf-address" label={strings.deliveryAddress}>
                        <input
                          id="sf-address"
                          name="address"
                          type="text"
                          autoComplete="street-address"
                          value={form.address}
                          onChange={(event) => updateForm("address", event.target.value)}
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
                          onChange={(event) => updateForm("neighborhood", event.target.value)}
                          className={INPUT_CLASSES}
                        />
                      </Field>
                      <Field id="sf-reference" label={strings.referencePoint}>
                        <input
                          id="sf-reference"
                          name="reference"
                          type="text"
                          value={form.reference}
                          onChange={(event) => updateForm("reference", event.target.value)}
                          className={INPUT_CLASSES}
                        />
                      </Field>
                    </div>
                  </fieldset>

                  <Field id="sf-notes" label={strings.orderNotes}>
                    <textarea
                      id="sf-notes"
                      name="notes"
                      rows={3}
                      value={form.notes}
                      onChange={(event) => updateForm("notes", event.target.value)}
                      className={`${INPUT_CLASSES} resize-y`}
                    />
                  </Field>

                  <Field id="sf-payment" label={strings.paymentMethod}>
                    <select
                      id="sf-payment"
                      name="payment"
                      value={form.payment}
                      onChange={(event) => updateForm("payment", event.target.value)}
                      className={INPUT_CLASSES}
                    >
                      <option value="">—</option>
                      <option value="cash">{strings.paymentCash}</option>
                      <option value="transfer">{strings.paymentTransfer}</option>
                      <option value="other">{strings.paymentOther}</option>
                    </select>
                  </Field>
                </form>
              </div>

              <div className="space-y-3 border-t border-border/70 px-4 py-4">
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span>{strings.subtotal}</span>
                  <span>{money(subtotal)}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {strings.checkoutNote}
                </p>
                <button
                  type="submit"
                  form="sf-checkout"
                  className={`${BUTTON_CLASSES} w-full`}
                >
                  <WhatsAppIcon className="size-4" />
                  {strings.orderWhatsApp}
                </button>
              </div>
            </>
          )}

          {/* ── vista 3/3: enviado ──────────────────────────────────── */}
          {activeView === "sent" && (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
              <CheckCircle2
                aria-hidden="true"
                className="size-10 text-[var(--sf-primary)]"
              />
              <p className="text-sm font-semibold">{strings.orderSent}</p>
              <p className="text-sm text-muted-foreground">
                {strings.checkoutNote}
              </p>
              <button
                type="button"
                onClick={() => handleOpenChange(false)}
                className={`${BUTTON_CLASSES} mt-2 w-full`}
              >
                {strings.continueShopping}
              </button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </CartContext.Provider>
  );
}
