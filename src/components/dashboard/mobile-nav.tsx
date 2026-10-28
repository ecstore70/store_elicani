"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
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
 */
export function MobileNav({
  items,
  storeName,
  storeSlug,
  openLabel,
  signOutLabel,
}: {
  items: NavItemView[];
  storeName?: string | null;
  storeSlug?: string | null;
  openLabel: string;
  signOutLabel: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={openLabel}>
          <Menu aria-hidden="true" />
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-72 gap-0 p-0">
        <SheetHeader className="border-b border-border/70 px-5 py-4 text-left">
          <SheetTitle className="sr-only">{openLabel}</SheetTitle>
          <Logo />
        </SheetHeader>

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
