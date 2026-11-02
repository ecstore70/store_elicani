"use client";

import type { Locale } from "@/lib/i18n/config";
import { formatCurrency } from "@/lib/currency";
import type {
  ProductOptionGroup,
} from "@/lib/storefront/product-options";

/**
 * Seletor GENÉRICO de opções de produto (tamanho, extras, remoções…).
 *
 * Componente CONTROLADO: o pai guarda o estado (`Record<groupId, choiceIds>`)
 * e reage às escolhas — as escolhas viajam no item do carrinho entram na
 * mensagem do WhatsApp com o acréscimo de preço aplicado.
 *
 * Nenhum produto de hoje tem opções (o modelo de dados ainda não as
 * inclui): a página de produto só monta este componente quando existirem
 * grupos configurados — NUNCA aparece uma secção vazia.
 */

export function ProductOptionSelector({
  groups,
  selected,
  onChange,
  error,
  currency,
  locale,
}: {
  groups: readonly ProductOptionGroup[];
  selected: Record<string, string[]>;
  onChange: (groupId: string, choiceId: string) => void;
  /** Primeiro grupo obrigatório por escolher (validação no adicionar). */
  error?: string | null;
  currency: string;
  locale: Locale;
}) {
  if (groups.length === 0) return null;

  return (
    <div className="space-y-4" aria-describedby={error ? "sf-options-err" : undefined}>
      {groups.map((group) => {
        const picked = selected[group.id] ?? [];
        return (
          <fieldset key={group.id}>
            <legend className="mb-1.5 text-sm font-medium">
              {group.label}
              {group.required && (
                <span aria-hidden="true" className="text-destructive">
                  {" *"}
                </span>
              )}
            </legend>

            <div className="flex flex-wrap gap-2">
              {group.choices.map((choice) => {
                const inputProps =
                  group.type === "single"
                    ? {
                        type: "radio" as const,
                        name: `sf-opt-${group.id}`,
                        checked: picked[0] === choice.id,
                      }
                    : {
                        type: "checkbox" as const,
                        checked: picked.includes(choice.id),
                      };
                return (
                  <label key={choice.id} className="cursor-pointer">
                    <input
                      {...inputProps}
                      aria-required={group.required}
                      onChange={() => onChange(group.id, choice.id)}
                      className="peer sr-only"
                    />
                    <span className="inline-flex items-center gap-1.5 rounded-[var(--sf-btn-radius)] border border-[var(--sf-border)] bg-[var(--sf-bg)] px-3 py-1.5 text-sm text-[var(--sf-fg)] peer-checked:border-[var(--sf-primary)] peer-checked:bg-[var(--sf-primary)] peer-checked:text-[var(--sf-on-primary)] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--sf-primary)]">
                      {choice.label}
                      {choice.priceDelta !== 0 && (
                        <span className="text-xs opacity-80">
                          {`${choice.priceDelta > 0 ? "+" : "-"}${formatCurrency(Math.abs(choice.priceDelta), currency, locale)}`}
                        </span>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        );
      })}

      {error && (
        <span id="sf-options-err" role="alert" className="block text-xs text-destructive">
          {error}
        </span>
      )}
    </div>
  );
}
