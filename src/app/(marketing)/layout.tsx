import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { MobileMenu, type MenuLink } from "@/components/marketing/mobile-menu";
import { getTranslator } from "@/lib/i18n/locale";

/**
 * Layout de marketing (página pública da Elicani).
 *
 * Cabeçalho sticky com hierarquia clara: logo → âncoras → Sign in →
 * CTA primário "Create your store" (azul da marca). No mobile, o mesmo
 * conteúdo vive no menu acessível (`MobileMenu`).
 *
 * Toda a copy passa pelo sistema i18n existente (`getTranslator`) — o
 * idioma vem do cookie `elicani_locale`, que nenhum seletor altera ainda
 * (o seletor de idioma é trabalho do sistema i18n, não do visual).
 *
 * O layout lê o cookie, logo a rota resolve em tempo de requisição;
 * `instant = false` autoriza o bloqueio (mesmo padrão de `/app` e das
 * páginas de autenticação) em vez de falhar o prerender com Cache Components.
 */
export const instant = false;

export default async function MarketingLayout({
  children,
}: {
  children: ReactNode;
}) {
  const t = await getTranslator();

  const links: MenuLink[] = [
    { href: "/#features", label: t("landing.navFeatures") },
    { href: "/#how-it-works", label: t("landing.navHow") },
  ];

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:h-[4.5rem] lg:px-8">
          <Link
            href="/"
            aria-label="Elicani"
            className="shrink-0 rounded-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <Logo className="h-7 w-auto sm:h-8" />
          </Link>

          <nav
            aria-label={t("landing.mainNav")}
            className="hidden items-center gap-1 lg:flex"
          >
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <Button
              variant="ghost"
              className="h-10 px-4"
              asChild
            >
              <Link href="/login">{t("landing.signIn")}</Link>
            </Button>
            <Button
              className="h-10 bg-brand-primary px-4 text-white hover:bg-brand-primary/90"
              asChild
            >
              <Link href="/signup">{t("landing.createStore")}</Link>
            </Button>
          </div>

          <MobileMenu
            links={links}
            navLabel={t("landing.mainNav")}
            signInLabel={t("landing.signIn")}
            ctaLabel={t("landing.createStore")}
            openLabel={t("landing.openMenu")}
            closeLabel={t("landing.closeMenu")}
          />
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border/70 bg-background">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div className="space-y-2">
              <Logo className="h-6 w-auto" />
              <p className="max-w-xs text-sm text-muted-foreground">
                {t("landing.footerTagline")}
              </p>
            </div>

            <nav
              aria-label={t("landing.footerNav")}
              className="flex flex-wrap gap-x-6 gap-y-2 text-sm"
            >
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/login"
                className="font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {t("landing.signIn")}
              </Link>
              <Link
                href="/signup"
                className="font-medium text-brand-primary transition-colors hover:text-brand-primary/80"
              >
                {t("landing.createStore")}
              </Link>
            </nav>
          </div>

          <div className="border-t border-border/70 pt-6 text-xs text-muted-foreground">
            {t("landing.footerRights", { year: new Date().getFullYear() })}
          </div>
        </div>
      </footer>
    </div>
  );
}
