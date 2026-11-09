"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type FormEvent,
  type ReactNode,
} from "react";
import { formatCurrency } from "@/lib/currency";
import type { Locale } from "@/lib/i18n/config";
import type { StorefrontStrings } from "@/lib/storefront/strings";
import { buildOrderMessage } from "@/lib/storefront/order-message";
import {
  isCheckoutComplete,
  validateCheckout,
  validateCheckoutField,
  type CheckoutErrors,
  type CheckoutForm,
  type RequiredCheckoutField,
} from "@/lib/storefront/checkout-validation";
import { recordOrderAction } from "@/lib/orders/actions";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import { useCart } from "./cart-provider";

/**
 * Estado do CHECKOUT — formulário do cliente, validação e envio por
 * WhatsApp, montado APENAS na rota `/store/{slug}/checkout`.
 *
 * É a mesma lógica de sempre (a que vivia no `CartProvider` e era
 * apresentada pelo diálogo), agora no sítio onde o checkout passou a
 * existir: um provider por rota, dentro do `CartProvider` (que fornece
 * itens/subtotal) e do `StoreShell`.
 *
 *  • o rascunho do formulário persiste em `sessionStorage` por loja —
 *    navegar entre a loja e o checkout não perde o que o cliente já
 *    escreveu (o rascunho só limpa depois de um envio bem-sucedido);
 *  • validação pura em `checkout-validation.ts` (nome, telefone e bairro
 *    obrigatórios; morada/referência/notas/pagamento opcionais);
 *  • guarda server-side do catálogo inativo ANTES de montar a mensagem;
 *  • a mensagem é a ESTRUTURADA de `buildOrderMessage` (testada) e o envio
 *    abre o WhatsApp com `wa.me` — nenhuma tabela nova (Fase 1).
 */

const EMPTY_FORM: CheckoutForm = {
  name: "",
  phone: "",
  address: "",
  neighborhood: "",
  reference: "",
  notes: "",
  payment: "",
};

/** Limites por campo — o rascunho vem do cliente, nunca é confiado. */
const DRAFT_LIMITS = {
  name: 120,
  phone: 30,
  address: 300,
  neighborhood: 120,
  reference: 200,
  notes: 1000,
} as const;

const PAYMENT_METHODS = ["cash", "transfer", "other"] as const;

function draftKey(storeId: string): string {
  return `elicani:checkout:${storeId}`;
}

function sanitizeDraft(raw: unknown): CheckoutForm {
  if (typeof raw !== "object" || raw === null) return EMPTY_FORM;
  const record = raw as Record<string, unknown>;
  const text = (key: keyof typeof DRAFT_LIMITS): string => {
    const value = record[key];
    return typeof value === "string" ? value.slice(0, DRAFT_LIMITS[key]) : "";
  };
  const payment = record.payment;
  return {
    name: text("name"),
    phone: text("phone"),
    address: text("address"),
    neighborhood: text("neighborhood"),
    reference: text("reference"),
    notes: text("notes"),
    payment:
      typeof payment === "string" &&
      (PAYMENT_METHODS as readonly string[]).includes(payment)
        ? payment
        : "",
  };
}

/** Store externo do RASCUNHO por loja — sessionStorage, sem contexto React. */
class CheckoutDraftStore {
  readonly storeId: string;
  private form: CheckoutForm | null = null;
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

  getSnapshot = (): CheckoutForm => {
    if (this.form === null) {
      // Leitura única do sessionStorage no primeiro snapshot do cliente.
      try {
        const raw = globalThis.sessionStorage?.getItem(draftKey(this.storeId));
        this.form = raw ? sanitizeDraft(JSON.parse(raw)) : EMPTY_FORM;
      } catch {
        this.form = EMPTY_FORM;
      }
    }
    return this.form;
  };

  getServerSnapshot = (): CheckoutForm => EMPTY_FORM;

  private set(next: CheckoutForm) {
    this.form = next;
    try {
      globalThis.sessionStorage?.setItem(
        draftKey(this.storeId),
        JSON.stringify(next),
      );
    } catch {
      // Storage cheio/bloqueado: o rascunho continua em memória.
    }
    for (const listener of this.listeners) listener();
  }

  update(key: keyof CheckoutForm, value: string) {
    this.set({ ...this.getSnapshot(), [key]: value });
  }

  clear() {
    this.set(EMPTY_FORM);
  }
}

const draftStores = new Map<string, CheckoutDraftStore>();

function getDraftStore(storeId: string): CheckoutDraftStore {
  let store = draftStores.get(storeId);
  if (!store) {
    store = new CheckoutDraftStore(storeId);
    draftStores.set(storeId, store);
  }
  return store;
}

export type CheckoutContextValue = {
  form: CheckoutForm;
  errors: CheckoutErrors;
  /** Aviso quando o envio foi bloqueado — catálogo inativo (ver `submit`). */
  orderError: string | null;
  /** Pedido enviado — a rota mostra a confirmação. */
  sent: boolean;
  /** CTA habilitado só com nome + telefone + localização prontos. */
  canSubmit: boolean;
  money: (value: number) => string;
  update: (key: keyof CheckoutForm, value: string) => void;
  /** Validação imediata ao sair de um campo obrigatório (blur). */
  blur: (field: RequiredCheckoutField) => void;
  submit: (event: FormEvent<HTMLFormElement>) => void;
};

const CheckoutContext = createContext<CheckoutContextValue | null>(null);

/** Hook de contexto — erro claro se o provider faltar. */
export function useCheckout(): CheckoutContextValue {
  const value = useContext(CheckoutContext);
  if (!value) {
    throw new Error("useCheckout must be used inside <CheckoutProvider>");
  }
  return value;
}

export function CheckoutProvider({
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
  const { items, subtotal } = useCart();
  const [errors, setErrors] = useState<CheckoutErrors>({});
  const [orderError, setOrderError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const draftStore = useMemo(() => getDraftStore(storeId), [storeId]);

  // Snapshot do rascunho: servidor vazio, cliente lê o sessionStorage —
  // mesma hidratação segura do carrinho (`useSyncExternalStore`).
  const form = useSyncExternalStore(
    draftStore.subscribe,
    draftStore.getSnapshot,
    draftStore.getServerSnapshot,
  );

  const whatsappDigits = whatsappNumber?.replace(/\D/g, "") ?? "";
  const hasChannel = whatsappDigits.length >= 7;

  const update = (key: keyof CheckoutForm, value: string) => {
    setOrderError(null);
    setErrors((current) => {
      const field = key as keyof CheckoutErrors;
      if (!(field in current)) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
    draftStore.update(key, value);
  };

  const blur = (field: RequiredCheckoutField) => {
    const message = validateCheckoutField(
      field,
      draftStore.getSnapshot(),
      strings,
    );
    setErrors((current) => {
      if (message) return { ...current, [field]: message };
      if (!(field in current)) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!hasChannel) return;

    // Fonte da verdade do formulário: o store do rascunho (o snapshot do
    // React pode estar um render atrás durante digitação rápida).
    const current = draftStore.getSnapshot();
    const nextErrors = validateCheckout(current, strings);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    // ── guarda server-side: catálogo inativo não fecha pedido ────────────
    // A consulta roda no Supabase sob o RLS público (`is_active` no próprio
    // WHERE): um cliente inativo é confirmado pelo SERVIDOR, não por um
    // toggle de UI. Bloqueia só quando o estado é confirmado como inativo;
    // erro de rede/DB falha em aberto para não perder um pedido válido.
    try {
      const supabase = createBrowserClient();
      const { data, error } = await supabase
        .from("stores")
        .select("id")
        .eq("id", storeId)
        .eq("is_active", true)
        .maybeSingle();
      if (!error && !data) {
        setOrderError(strings.catalogUnavailable);
        return;
      }
    } catch {
      // falha em aberto: segue para o WhatsApp (mesma convenção do proxy).
    }

    // ── gravação do pedido (adicional, best-effort) ──────────────────────
    // O WhatsApp continua a ser o envio da Fase 1 e NUNCA é bloqueado por
    // esta gravação: promessa lançada em paralelo, falha só logada. O que
    // sai daqui é IDENTIDADE das linhas (produto/quantidade/opções) —
    // nome, preço e totais são recalculados no servidor pela função
    // `record_order`; valores do navegador nunca viram número.
    void recordOrderAction({
      storeId,
      customer: {
        name: current.name,
        phone: current.phone,
        address: current.address.trim() || undefined,
        neighborhood: current.neighborhood.trim() || undefined,
        reference: current.reference.trim() || undefined,
        notes: current.notes || undefined,
        payment:
          current.payment === "cash" ||
          current.payment === "transfer" ||
          current.payment === "other"
            ? current.payment
            : null,
      },
      lines: items.map((item) => ({
        productId: item.id,
        qty: item.qty,
        options: item.options,
      })),
    })
      .then((result) => {
        if (!result.ok) {
          console.warn("[checkout] pedido não gravado:", result.code);
        }
      })
      .catch((error) => {
        console.error("[checkout] falha ao gravar pedido:", error);
      });

    const paymentLabel =
      current.payment === "cash"
        ? strings.paymentCash
        : current.payment === "transfer"
          ? strings.paymentTransfer
          : current.payment === "other"
            ? strings.paymentOther
            : "";

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
        name: current.name.trim(),
        phone: current.phone.trim(),
        address: current.address.trim() || undefined,
        neighborhood: current.neighborhood.trim() || undefined,
        reference: current.reference.trim() || undefined,
        notes: current.notes || undefined,
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
    // Pedido enviado → rascunho limpo para a próxima compra.
    draftStore.clear();
    setErrors({});
    setOrderError(null);
    setSent(true);
  };

  // Objeto novo a cada render de propósito: o formulário muda a cada
  // tecla e o consumidor (`CheckoutView`) tem de reagir — sem memo que
  // possa servir closures velhas (o envio lê itens/subtotal atuais).
  const value: CheckoutContextValue = {
    form,
    errors,
    orderError,
    sent,
    canSubmit: isCheckoutComplete(form),
    money: (amount) => formatCurrency(amount, currency, locale),
    update,
    blur,
    submit,
  };

  return (
    <CheckoutContext.Provider value={value}>
      {children}
    </CheckoutContext.Provider>
  );
}
