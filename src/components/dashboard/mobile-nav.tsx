"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Menu } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { LocaleSelector } from "@/components/shared/locale-selector";
import type { Locale } from "@/lib/i18n/config";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SignOutButton } from "./sign-out-button";
import { SidebarNav } from "./sidebar-nav";
import type { NavItemView } from "./nav-items";

/**
 * Navegação compacta para telemóveis: gaveta com a mesma lista do desktop.
 * Fecha sozinha ao navegar — sem estado partilhado desnecessário.
 *
 * Em RTL a gaveta abre da borda START (direita) — `side` dinâmico, sem
 * duplicar implementações.
 */
export function MobileNav({
  items,
  storeName,
  storeSlug,
  catalogsLabel,
  openLabel,
  signOutLabel,
  currentLocale,
  localeLabel,
  direction,
}: {
  items: NavItemView[];
  storeName?: string | null;
  storeSlug?: string | null;
  /** Rótulo da ação "ver todos os catálogos" (multi-catalog). */
  catalogsLabel: string;
  openLabel: string;
  signOutLabel: string;
  currentLocale: Locale;
  localeLabel: string;
  direction: "ltr" | "rtl";
}) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={openLabel}>
          <Menu aria-hidden="true" />
        </Button>
      </SheetTrigger>

      <SheetContent
        side={direction === "rtl" ? "right" : "left"}
        className="w-72 gap-0 p-0"
      >
        <SheetHeader className="border-b border-border/70 px-5 py-4 text-start">
          <SheetTitle className="sr-only">{openLabel}</SheetTitle>
          <Logo />
        </SheetHeader>

        <div className="border-b border-border/70 p-3">
          <LocaleSelector
            current={currentLocale}
            label={localeLabel}
            className="w-full"
          />
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          <SidebarNav items={items} onNavigate={() => setOpen(false)} />
        </nav>

        {storeName && (
          <div className="border-t border-border/70 px-5 py-3">
            <p className="truncate text-sm font-medium">{storeName}</p>
            {storeSlug && (
              <p className="truncate font-mono text-xs text-muted-foreground">
                {storeSlug}
              </p>
            )}
            {/* Multi-catalog: o nome acima identifica o catálogo ATIVO;
                a linha abaixo é a AÇÃO de navegar para a lista completa —
                mesma distinção do desktop (hover/pressed/focus/alvo ≥44px). */}
            <Link
              href="/app/catalogs"
              className="-mx-2.5 mt-1.5 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground active:bg-accent active:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {catalogsLabel}
              <ChevronRight
                aria-hidden="true"
                className="size-3.5 shrink-0 rtl:rotate-180"
              />
            </Link>
          </div>
        )}

        <div className="border-t border-border/70 p-3">
          <SignOutButton
            label={signOutLabel}
            className="w-full justify-start text-muted-foreground"
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
