"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Menu da navegação de marketing no mobile.
 *
 * Anel acessível: `aria-expanded`/`aria-controls`, rótulo dinâmico e alvos
 * de toque de 44px. Abre para baixo do cabeçalho sticky (que é o bloco
 * posicionado mais próximo).
 */

export type MenuLink = {
  href: string;
  label: string;
};

export function MobileMenu({
  links,
  navLabel,
  signInLabel,
  ctaLabel,
  openLabel,
  closeLabel,
}: {
  links: MenuLink[];
  navLabel: string;
  signInLabel: string;
  ctaLabel: string;
  openLabel: string;
  closeLabel: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="marketing-mobile-menu"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex size-10 items-center justify-center rounded-lg border border-border/70 bg-background text-foreground transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        {open ? (
          <X aria-hidden="true" className="size-5" />
        ) : (
          <Menu aria-hidden="true" className="size-5" />
        )}
        <span className="sr-only">{open ? closeLabel : openLabel}</span>
      </button>

      {open && (
        <div
          id="marketing-mobile-menu"
          className="absolute inset-x-0 top-full border-b border-border/70 bg-background px-4 py-4 shadow-lg sm:px-6"
        >
          <nav aria-label={navLabel}>
            <ul className="space-y-1">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-3 py-2.5 text-base font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mt-3 flex flex-col gap-2 border-t border-border/70 pt-4">
            <Button
              variant="outline"
              className="h-11 w-full text-base"
              asChild
            >
              <Link href="/login" onClick={() => setOpen(false)}>
                {signInLabel}
              </Link>
            </Button>
            <Button
              className="h-11 w-full bg-brand-primary text-base text-white hover:bg-brand-primary/90"
              asChild
            >
              <Link href="/signup" onClick={() => setOpen(false)}>
                {ctaLabel}
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
