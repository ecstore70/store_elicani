import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";

/**
 * Layout de marketing (página pública da Elicani).
 *
 * A cópia desta área ainda é estática em inglês — a arquitetura i18n já
 * suporta os nove idiomas; a tradução do marketing é trabalho de fase
 * futura, não da Fase 1.
 */
export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="border-b border-border/70">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" aria-label="Elicani home">
            <Logo />
          </Link>

          <nav className="flex items-center gap-1.5">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/signup">Create account</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border/70">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-1 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span>© Elicani</span>
          <span>Online storefronts with WhatsApp orders.</span>
        </div>
      </footer>
    </div>
  );
}
