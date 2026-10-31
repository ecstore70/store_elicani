import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { LocaleSelector } from "@/components/shared/locale-selector";
import { getLocale } from "@/lib/i18n/locale";
import { createTranslator } from "@/lib/i18n/translate";

/**
 * O layout lê o cookie de idioma para o seletor e os títulos — a rota
 * resolve em tempo de requisição (mesmo padrão do restante da app).
 */
export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const t = createTranslator(await getLocale());
  return { title: t("auth.signIn") };
}

/**
 * Layout da área de autenticação: cartão centrado sobre fundo neutro.
 * Sem sessão aqui — o proxy envia usuários logados direto para /app.
 *
 * O seletor de idioma vive no cabeçalho: o visitante escolhe o idioma
 * ANTES de criar conta, e a escolha (cookie) acompanha registo, onboarding
 * e painel.
 */
export default async function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  const locale = await getLocale();
  const t = createTranslator(locale);

  return (
    <div className="flex min-h-svh flex-col bg-muted/40">
      <header className="flex h-16 items-center justify-between gap-3 px-4 sm:px-8">
        <Link href="/" aria-label="Elicani home">
          <Logo />
        </Link>
        <LocaleSelector
          current={locale}
          label={t("locale.changeLanguage")}
          className="w-44"
        />
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
