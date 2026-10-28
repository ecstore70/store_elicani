import type { ReactNode } from "react";
import { Logo } from "@/components/shared/logo";
import { getTranslator } from "@/lib/i18n/locale";
import { buildNavItems } from "./nav-items";
import { MobileNav } from "./mobile-nav";
import { SidebarNav } from "./sidebar-nav";
import { SignOutButton } from "./sign-out-button";

/**
 * Shell do painel.
 *
 * Desktop: barra lateral fixa com a navegação.
 * Mobile: cabeçalho compacto + gaveta.
 *
 * Superfícies claras, bordas subtis e tipografia forte — nada de
 * glassmorphism, gradientes pesados ou UI corporativa escura.
 */
export async function AppShell({
  storeName,
  storeSlug,
  children,
}: {
  storeName?: string | null;
  storeSlug?: string | null;
  children: ReactNode;
}) {
  const t = await getTranslator();
  const items = buildNavItems(t);

  return (
    <div className="flex min-h-svh w-full">
      <aside className="sticky top-0 hidden h-svh w-60 shrink-0 flex-col border-r border-border/70 bg-sidebar lg:flex">
        <div className="flex h-16 items-center border-b border-border/70 px-5">
          <Logo />
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          <SidebarNav items={items} />
        </nav>

        <div className="mt-auto">
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
              label={t("shell.signOut")}
              className="w-full justify-start text-muted-foreground"
            />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border/70 bg-background px-4 lg:hidden">
          <MobileNav
            items={items}
            storeName={storeName}
            storeSlug={storeSlug}
            openLabel={t("shell.openMenu")}
            signOutLabel={t("shell.signOut")}
          />
          <Logo />
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-12">
          {children}
        </main>
      </div>
    </div>
  );
}
