import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/shared/logo";

export const metadata: Metadata = {
  title: "Sign in",
};

/**
 * Layout da área de autenticação: cartão centrado sobre fundo neutro.
 * Sem sessão aqui — o proxy envia usuários logados direto para /app.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-muted/40">
      <header className="flex h-16 items-center px-4 sm:px-8">
        <Link href="/" aria-label="Elicani home">
          <Logo />
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm rounded-2xl border border-border/70 bg-card p-6 shadow-sm sm:p-8">
          {children}
        </div>
      </main>

      <footer className="px-4 pb-6 text-center text-xs text-muted-foreground">
        © Elicani
      </footer>
    </div>
  );
}
