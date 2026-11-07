import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { SignOutButton } from "@/components/dashboard/sign-out-button";
import { Logo } from "@/components/shared/logo";
import { StoreForm } from "@/components/store/store-form";
import { requireUser } from "@/lib/auth/session";
import { DEFAULT_CURRENCY } from "@/lib/currency";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";
import { getLocale } from "@/lib/i18n/locale";
import { createTranslator } from "@/lib/i18n/translate";
import { getStoreForOwner } from "@/lib/stores/queries";

export async function generateMetadata(): Promise<Metadata> {
  const t = createTranslator(await getLocale());
  return { title: t("landing.createStore") };
}

/**
 * Onboarding: lojista autenticado sem loja.
 * Já tem loja → manda direto para o dashboard.
 *
 * `?deleted=1` é o destino do fluxo de exclusão do catálogo: mostra o
 * aviso de sucesso (a ação já expirou o cache da loja — sem loja fantasma
 * a redirecionar de volta para o dashboard).
 */
export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string }>;
}) {
  const { deleted } = await searchParams;
  const user = await requireUser();

  const existingStore = await getStoreForOwner(user.id);
  if (existingStore) {
    redirect("/app");
  }

  const locale: Locale = await getLocale();
  const t = createTranslator(locale);

  return (
    <div className="flex min-h-svh flex-col bg-muted/40">
      <header className="flex h-16 items-center justify-between border-b border-border/70 bg-background px-4 sm:px-8">
        <Logo />
        <SignOutButton
          label={t("shell.signOut")}
          className="text-muted-foreground"
        />
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6 lg:py-16">
        {deleted === "1" && (
          <div
            role="status"
            aria-live="polite"
            className="mb-6 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
          >
            <CheckCircle2 aria-hidden="true" className="size-4 shrink-0" />
            {t("catalog.deleted")}
          </div>
        )}
        <div className="mb-8 space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("onboarding.title")}
          </h1>
          <p className="max-w-prose text-sm text-muted-foreground">
            {t("onboarding.subtitle")}
          </p>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm sm:p-8">
          <StoreForm
            locale={locale}
            mode="create"
            // Sugestões, nunca amarrações: a pessoa pode trocar idioma e
            // moeda de forma independente.
            initialValues={{
              language: locale ?? DEFAULT_LOCALE,
              currency: DEFAULT_CURRENCY,
            }}
          />
        </div>
      </main>
    </div>
  );
}
