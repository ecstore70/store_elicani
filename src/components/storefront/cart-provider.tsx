"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { getLocaleDirection, type Locale } from "@/lib/i18n/config";
import type { PublicProduct } from "@/lib/catalog/types";
import type { StorefrontStrings } from "@/lib/storefront/strings";
import {
  optionsSignature,
  selectedOptionsPrice,
  type SelectedOption,
} from "@/lib/storefront/product-options";
import { CartDialog } from "./cart-dialog";

/**
 * Carrinho da vitrine — estado CLIENTE persistido em localStorage, por loja.
 *
 * Sem servidor de carrinho: o visitante monta o pedido e envia-o por
 * WhatsApp (o canal de encomendas previsto pela Fase 1). Nada de pagamentos,
 * sessão ou tabelas.
 *
 * O fluxo de compra é **carrinho → rota de checkout → enviado**:
 *  • o `CartDialog` (ecrã-cheio no mobile, modal no desktop) apresenta APENAS
 *    o carrinho — o botão "Finalizar compra" navega para
 *    `/store/{slug}/checkout`;
 *  • o formulário (dados do cliente, entrega, pagamento), a validação e o
 *    envio por WhatsApp vivem no `CheckoutProvider` + `CheckoutView`
 *    (rota própria, superfície sólida de ecommerce) — ver
 *    `checkout-provider.tsx`;
 *  • a mensagem final é a ESTRUTURADA construída por `buildOrderMessage`
 *    (testada em `order-message.test.ts`).
 *
 * Adicionar produto NÃO abre o carrinho: um aviso discreto ("Adicionado ao
 * carrinho") confirma a ação e o visitante continua a comprar — ele é quem
 * decide quando abrir o carrinho (cabeçalho).
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

export function CartProvider({
  storeId,
  storeSlug,
  whatsappNumber,
  currency,
  locale,
  strings,
  children,
}: {
  storeId: string;
  storeSlug: string;
  whatsappNumber: string | null;
  currency: string;
  locale: Locale;
  strings: StorefrontStrings;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const addToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cartStore = useMemo(() => getCartStore(storeId), [storeId]);

  const items = useSyncExternalStore(
    cartStore.subscribe,
    cartStore.getSnapshot,
    cartStore.getServerSnapshot,
  );

  useEffect(
    () => () => {
      if (addToastTimer.current) clearTimeout(addToastTimer.current);
    },
    [],
  );

  const add = useCallback(
    (product: PublicProduct, options?: readonly SelectedOption[], qty?: number) => {
      cartStore.add(product, options, qty);
      // Confirmação discreta — o visitante continua na loja (não abrimos o
      // carrinho por ele).
      setJustAdded(true);
      if (addToastTimer.current) clearTimeout(addToastTimer.current);
      addToastTimer.current = setTimeout(() => setJustAdded(false), 2400);
    },
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

  const money = (amount: number) => formatCurrency(amount, currency, locale);

  // Sem canal de WhatsApp o carrinho nunca oferece checkout (a Fase 1 é
  // por WhatsApp) — mesma semântica de sempre: nenhum botão de envio.
  const whatsappDigits = whatsappNumber?.replace(/\D/g, "") ?? "";
  const hasChannel = whatsappDigits.length >= 7;

  return (
    <CartContext.Provider value={value}>
      {children}

      <CartDialog
        open={open}
        onOpenChange={setOpen}
        items={items}
        count={value.count}
        subtotal={value.subtotal}
        hasChannel={hasChannel}
        checkoutHref={`/store/${storeSlug}/checkout`}
        increment={increment}
        decrement={decrement}
        remove={remove}
        money={money}
        strings={strings}
        dir={getLocaleDirection(locale)}
      />

      {/* aviso discreto de "adicionado ao carrinho" (role=status anuncia) */}
      {justAdded && (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex justify-center px-4"
        >
          <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-[var(--sf-border)] bg-[var(--sf-bg)] px-4 py-2.5 text-sm font-medium text-[var(--sf-fg)] shadow-lg animate-in fade-in-0 slide-in-from-bottom-2">
            <CheckCircle2
              aria-hidden="true"
              className="size-4 text-[var(--sf-primary)]"
            />
            {strings.addedToCart}
          </div>
        </div>
      )}
    </CartContext.Provider>
  );
}
