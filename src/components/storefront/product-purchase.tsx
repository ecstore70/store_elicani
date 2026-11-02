"use client";

import { useMemo, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { WhatsAppIcon } from "@/components/shared/whatsapp-icon";
import type { Locale } from "@/lib/i18n/config";
import { formatCurrency } from "@/lib/currency";
import type { PublicProduct } from "@/lib/catalog/types";
import { BUTTON_CLASSES } from "@/lib/storefront/theme";
import {
  firstUnselectedRequired,
  selectedOptionsPrice,
  type ProductOptionGroup,
  type SelectedOption,
} from "@/lib/storefront/product-options";
import type { StorefrontStrings } from "@/lib/storefront/strings";
import { ProductOptionSelector } from "./product-option-selector";
import { useCart } from "./cart-provider";

/**
 * Painel de compra da PÁGINA DE PRODUTO: quantidade + opções (quando o
 * produto as tem) + adicionar ao carrinho + ação WhatsApp.
 *
 * Ao adicionar, um aviso discreto ("Adicionado ao carrinho") confirma a
 * ação SEM roubar o controlo: o visitante continua na loja e decide quando
 * abre o carrinho (cabeçalho). Sem canal de WhatsApp configurado, o botão
 * WhatsApp não renderiza (mesma regra do resto da vitrine).
 */

/** Campo futuro do modelo de dados — hoje todos os produtos chegam sem. */
type ProductWithOptions = PublicProduct & { options?: ProductOptionGroup[] };

const OUTLINE_CLASSES =
  "inline-flex items-center justify-center gap-1.5 rounded-[var(--sf-btn-radius)] border border-[var(--sf-border)] bg-[var(--sf-surface)] px-[var(--sf-btn-px)] py-[var(--sf-btn-py)] text-sm font-medium text-[var(--sf-fg)] transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sf-primary)] disabled:pointer-events-none disabled:opacity-50";

export function ProductPurchase({
  product,
  storeName,
  productUrl,
  whatsappHref,
  strings,
  currency,
  locale,
}: {
  product: PublicProduct;
  storeName: string;
  /** URL canónica (subdomínio) incluída na mensagem de contacto. */
  productUrl: string;
  /** `wa.me` da loja com saudação; `null` sem WhatsApp configurado. */
  whatsappHref: string | null;
  strings: StorefrontStrings;
  currency: string;
  locale: Locale;
}) {
  const cart = useCart();
  const [qty, setQty] = useState(1);
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [optionError, setOptionError] = useState<string | null>(null);

  // Campo futuro do modelo de dados — memo para as dependências dos hooks.
  const groups = useMemo(
    () => (product as ProductWithOptions).options ?? [],
    [product],
  );

  const chosenOptions: SelectedOption[] = useMemo(() => {
    const result: SelectedOption[] = [];
    for (const group of groups) {
      const ids = selected[group.id] ?? [];
      for (const choice of group.choices) {
        if (ids.includes(choice.id)) {
          result.push({
            groupLabel: group.label,
            choiceLabel: choice.label,
            priceDelta: choice.priceDelta,
          });
        }
      }
    }
    return result;
  }, [groups, selected]);

  const unitPrice =
    (product.promo_price ?? product.price) + selectedOptionsPrice(chosenOptions);

  const toggleChoice = (groupId: string, choiceId: string) => {
    setOptionError(null);
    setSelected((current) => {
      const group = groups.find((item) => item.id === groupId);
      if (!group) return current;
      const picked = current[groupId] ?? [];
      if (group.type === "single") {
        return { ...current, [groupId]: [choiceId] };
      }
      const next = picked.includes(choiceId)
        ? picked.filter((id) => id !== choiceId)
        : [...picked, choiceId];
      return { ...current, [groupId]: next };
    });
  };

  const handleAdd = () => {
    const missing = firstUnselectedRequired(groups, selected);
    if (missing) {
      setOptionError(strings.optionsRequired);
      return;
    }
    cart.add(product, chosenOptions, qty);
  };

  const orderText = `*${storeName}*\n${product.name} — ${formatCurrency(unitPrice, currency, locale)}\n${productUrl}`;
  const inquiryHref = whatsappHref
    ? `${whatsappHref}?text=${encodeURIComponent(orderText)}`
    : null;

  return (
    <div className="space-y-4">
      {/* opções — só renderiza com grupos configurados */}
      <ProductOptionSelector
        groups={groups}
        selected={selected}
        onChange={toggleChoice}
        error={optionError}
        currency={currency}
        locale={locale}
      />

      {/* total da linha — só quando muda face ao preço já exibido acima
          (opções configuradas e/ou quantidade > 1) */}
      {(groups.length > 0 || qty > 1) && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{strings.subtotal}</span>
          <span className="font-semibold tabular-nums">
            {formatCurrency(unitPrice * qty, currency, locale)}
          </span>
        </div>
      )}

      <div className="flex items-center gap-3">
        {/* quantidade */}
        <div className="inline-flex items-center rounded-[var(--sf-btn-radius)] border border-[var(--sf-border)]">
          <button
            type="button"
            aria-label={strings.decreaseQty}
            disabled={qty <= 1}
            onClick={() => setQty((current) => Math.max(1, current - 1))}
            className="inline-flex size-10 items-center justify-center text-[var(--sf-fg)] hover:opacity-70 disabled:opacity-40"
          >
            <Minus aria-hidden="true" className="size-4" />
          </button>
          <span
            className="w-8 text-center text-sm font-medium tabular-nums"
            aria-label={`${strings.itemQuantity}: ${qty}`}
          >
            {qty}
          </span>
          <button
            type="button"
            aria-label={strings.increaseQty}
            onClick={() => setQty((current) => current + 1)}
            className="inline-flex size-10 items-center justify-center text-[var(--sf-fg)] hover:opacity-70"
          >
            <Plus aria-hidden="true" className="size-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={!product.is_available}
          className={`${BUTTON_CLASSES} flex-1`}
        >
          {strings.addToCart}
        </button>
      </div>

      {inquiryHref && (
        <a
          href={inquiryHref}
          target="_blank"
          rel="noreferrer"
          className={`${OUTLINE_CLASSES} w-full`}
        >
          <WhatsAppIcon className="size-4" />
          {strings.whatsappContact}
        </a>
      )}
    </div>
  );
}
