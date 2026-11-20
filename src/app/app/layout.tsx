import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { requireUser } from "@/lib/auth/session";

/**
 * Toda a área /app depende da sessão (cookies) a cada requisição: não pode
 * entrar no shell estático. Documentado no Next 16 como opt-out de
 * prerender — ver `instant` em route segment config.
 */
export const instant = false;

/**
 * Metadados da área PRIVADA (dashboard + onboarding): `index: false,
 * follow: false` como DEFESA EM PROFUNDIDADE — o proxy já redireciona
 * visitantes sem sessão para /login (que também é noindex), mas a
 * diretiva garante que, se alguma barreira ceder, o conteúdo do painel
 * nunca entre no índice.
 *
 * O robots.txt continua PERMITINDO /app: bloquear por robots.txt
 * esconderia esta diretiva noindex (armadilha clássica — a página seria
 * indexada às cegas). Filosofia registrada em src/app/robots.ts.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Guarda de autenticação de toda a área /app.
 *
 * O proxy já bloqueia visitantes sem sessão; aqui validamos de novo porque
 * server actions e páginas devem se proteger sozinhas — o proxy não é a
 * única barreira.
 *
 * Fica atrás de <Suspense>: uma leitura de sessão é dado de requisição e,
 * com Cache Components, precisa de uma fronteira para não entrar no shell
 * estático (ver guia "Authentication with Cache Components").
 */
async function AuthenticatedArea({ children }: { children: ReactNode }) {
  await requireUser();
  return <>{children}</>;
}

/** Fallback enquanto a sessão é validada — não inventa dados do painel. */
function SessionFallback() {
  return (
    <div
      className="flex min-h-svh items-center justify-center"
      aria-busy="true"
    >
      <div className="w-full max-w-5xl space-y-8 px-4 py-12 sm:px-10">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
        <Skeleton className="h-72 rounded-xl" />
      </div>
    </div>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<SessionFallback />}>
      <AuthenticatedArea>{children}</AuthenticatedArea>
    </Suspense>
  );
}
