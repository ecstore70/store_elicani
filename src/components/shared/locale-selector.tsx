"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Globe } from "lucide-react";
import {
  LOCALE_LABELS,
  SUPPORTED_LOCALES,
  type Locale,
} from "@/lib/i18n/config";
import { setLocale } from "@/lib/i18n/actions";
import { cn } from "@/lib/utils";

/**
 * Seletor de idioma da UI — UMA única implementação reutilizada no
 * cabeçalho de marketing (desktop + menu mobile), na área de
 * autenticação, no shell/definições do painel e na vitrine pública.
 *
 * Comunica explicitamente que muda o idioma da interface (rótulo +
 * `aria-label` traduzidos pelo chamador). A escolha vai para o cookie
 * `elicani_locale` via server action e a UI atualiza imediatamente com
 * `router.refresh()` — sem libs de estado extra.
 */
export function LocaleSelector({
  current,
  label,
  className,
  align = "end",
  tone = "platform",
}: {
  current: Locale;
  /** Rótulo acessível/visível traduzido pelo chamador. */
  label: string;
  className?: string;
  align?: "start" | "end";
  /**
   * `platform` (default): tokens da UI Elicani.
   * `storefront`: usa as variáveis `--sf-*` do tema da loja — o seletor
   * pertence à camada de UI da vitrine, não ao painel.
   */
  tone?: "platform" | "storefront";
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Fecha ao clicar fora ou ao premir Escape.
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const choose = (locale: Locale) => {
    setOpen(false);
    if (locale === current) return;
    void (async () => {
      await setLocale(locale);
      // Re-render do RSC com o novo cookie — a página muda de idioma já.
      startTransition(() => router.refresh());
    })();
  };

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${label}: ${LOCALE_LABELS[current]}`}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "inline-flex h-9 w-full items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
          tone === "storefront"
            ? "border-[var(--sf-border)] bg-[var(--sf-surface)] text-[var(--sf-fg)] hover:bg-[var(--sf-bg)]"
            : "border-border/70 bg-background text-foreground hover:bg-muted",
        )}
      >
        <Globe
          aria-hidden="true"
          className={cn(
            "size-4 shrink-0",
            tone === "storefront"
              ? "text-[var(--sf-muted)]"
              : "text-muted-foreground",
          )}
        />
        <span className="min-w-0 flex-1 truncate text-start">
          {LOCALE_LABELS[current]}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "size-4 shrink-0 transition-transform",
            tone === "storefront"
              ? "text-[var(--sf-muted)]"
              : "text-muted-foreground",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={label}
          className={cn(
            "absolute top-full z-50 mt-1 min-w-full overflow-hidden rounded-lg border border-border/70 bg-popover p-1 text-popover-foreground shadow-lg",
            align === "end" ? "end-0" : "start-0",
          )}
        >
          {SUPPORTED_LOCALES.map((locale) => {
            const selected = locale === current;
            return (
              <li key={locale} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => choose(locale)}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-start text-sm transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  <Check
                    aria-hidden="true"
                    className={cn(
                      "size-4 shrink-0 text-brand-primary",
                      !selected && "invisible",
                    )}
                  />
                  <span className="truncate">{LOCALE_LABELS[locale]}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
