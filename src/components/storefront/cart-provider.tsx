"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { formatCurrency } from "@/lib/currency";
import type { Locale } from "@/lib/i18n/config";
import type { PublicProduct } from "@/lib/catalog/types";
import { BUTTON_CLASSES } from "@/lib/storefront/theme";
import type { StorefrontStrings } from "@/lib/storefront/strings";

/**
 * Carrinho da vitrine — estado CLIENTE persistido em localStorage, por loja.
 *
 * Sem servidor de carrinho: o visitante monta o pedido e envia-o por
 * WhatsApp (o canal de encomendas previsto pela Fase 1). Nada de pagamentos,
 * sessão ou tabelas.
 *
 * A hidratação usa `useSyncExternalStore` (padrão React para stores
 * externos): o snapshot do servidor é vazio, o cliente lê o localStorage
 * e o HTML nunca diverge durante a hidratação.
 */

export type CartItem = {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  qty: number;
};

const EMPTY_ITEMS: CartItem[] = [];

function storageKey(storeId: string): string {
  return `elicani:cart:${storeId}`;
}

function sanitizeItems(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (item): item is CartItem =>
      typeof item === "object" &&
      item !== null &&
      typeof item.id === "string" &&
      typeof item.name === "string" &&
      typeof item.price === "number" &&
      typeof item.qty === "number",
  );
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

  add(product: PublicProduct) {
    if (!product.is_available) return;
    const current = this.getSnapshot();
    const existing = current.find((item) => item.id === product.id);
    if (existing) {
      this.set(
        current.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item,
        ),
      );
      return;
    }
    this.set([
      ...current,
      {
        id: product.id,
        name: product.name,
        price: product.promo_price ?? product.price,
        imageUrl: product.image_url,
        qty: 1,
      },
    ]);
  }

  increment(id: string) {
    this.set(
      this.getSnapshot().map((item) =>
        item.id === id ? { ...item, qty: item.qty + 1 } : item,
      ),
    );
  }

  decrement(id: string) {
    this.set(
      this.getSnapshot().flatMap((item) =>
        item.id === id
          ? item.qty > 1
            ? [{ ...item, qty: item.qty - 1 }]
            : []
          : [item],
      ),
    );
  }

  remove(id: string) {
    this.set(this.getSnapshot().filter((item) => item.id !== id));
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
  add: (product: PublicProduct) => void;
  increment: (id: string) => void;
  decrement: (id: string) => void;
  remove: (id: string) => void;
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
  const cartStore = useMemo(() => getCartStore(storeId), [storeId]);

  const items = useSyncExternalStore(
    cartStore.subscribe,
    cartStore.getSnapshot,
    cartStore.getServerSnapshot,
  );

  const add = useCallback(
    (product: PublicProduct) => cartStore.add(product),
    [cartStore],
  );
  const increment = useCallback(
    (id: string) => cartStore.increment(id),
    [cartStore],
  );
  const decrement = useCallback(
    (id: string) => cartStore.decrement(id),
    [cartStore],
  );
  const remove = useCallback(
    (id: string) => cartStore.remove(id),
    [cartStore],
  );

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
      setOpen,
      add,
      increment,
      decrement,
      remove,
    };
  }, [items, open, add, increment, decrement, remove]);

  const subtotal = value.subtotal;
  const whatsappDigits = whatsappNumber?.replace(/\D/g, "") ?? "";
  const orderLines = items
    .map(
      (item) =>
        `${item.qty}× ${item.name} — ${formatCurrency(item.price * item.qty, currency, locale)}`,
    )
    .join("\n");
  const orderMessage = `*${storeName}* — ${strings.cart}\n\n${orderLines}\n\n${strings.subtotal}: ${formatCurrency(subtotal, currency, locale)}`;
  const whatsappHref = whatsappDigits
    ? `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(orderMessage)}`
    : null;

  return (
    <CartContext.Provider value={value}>
      {children}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
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
        </SheetTrigger>

        <SheetContent side="right" className="flex w-full flex-col sm:max-w-sm">
          <SheetHeader>
            <SheetTitle>{strings.cart}</SheetTitle>
            <SheetDescription className="sr-only">
              {strings.cart}
            </SheetDescription>
          </SheetHeader>

          {items.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
              <ShoppingBag aria-hidden="true" className="size-8 text-muted-foreground" />
              <p className="text-sm font-medium">{strings.cartEmpty}</p>
              <p className="text-sm text-muted-foreground">{strings.cartEmptyBody}</p>
            </div>
          ) : (
            <>
              <ul className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {items.map((item) => (
                  <li key={item.id} className="flex items-start gap-3">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imageUrl}
                        alt=""
                        className="size-12 shrink-0 rounded-md border border-border/70 object-cover"
                      />
                    ) : (
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-md border border-border/70 bg-muted/40">
                        <ShoppingBag aria-hidden="true" className="size-4 text-muted-foreground" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(item.price, currency, locale)}
                      </p>

                      <div className="mt-1.5 flex items-center gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          aria-label={`${strings.decreaseQty}: ${item.name}`}
                          onClick={() => decrement(item.id)}
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
                          onClick={() => increment(item.id)}
                        >
                          <Plus aria-hidden="true" className="size-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="ms-auto text-muted-foreground hover:text-destructive"
                          aria-label={`${strings.removeItem}: ${item.name}`}
                          onClick={() => remove(item.id)}
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
                  <span>{formatCurrency(subtotal, currency, locale)}</span>
                </div>

                {whatsappHref ? (
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noreferrer"
                    className={`${BUTTON_CLASSES} w-full`}
                  >
                    {strings.orderWhatsApp}
                  </a>
                ) : null}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </CartContext.Provider>
  );
}
