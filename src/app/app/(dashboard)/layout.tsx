import type { ReactNode } from "react";
import { AppShell } from "@/components/dashboard/app-shell";
import { requireUser } from "@/lib/auth/session";
import { requireStore } from "@/lib/stores/queries";

/**
 * Área do painel que exige loja.
 *
 * Sem loja → onboarding (nunca um dashboard vazio fingindo ter dados).
 * Com loja → shell com barra lateral e cabeçalho responsivo.
 */
export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireUser();
  const store = await requireStore(user.id);

  return (
    <AppShell storeName={store.name} storeSlug={store.slug}>
      {children}
    </AppShell>
  );
}
