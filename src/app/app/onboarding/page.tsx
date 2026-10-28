import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/dashboard/sign-out-button";
import { Logo } from "@/components/shared/logo";
import { StoreForm } from "@/components/store/store-form";
import { requireUser } from "@/lib/auth/session";
import { DEFAULT_CURRENCY } from "@/lib/currency";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";
import { getLocale } from "@/lib/i18n/locale";
import { createTranslator } from "@/lib/i18n/translate";
import { getStoreForOwner } from "@/lib/stores/queries";

export const metadata: Metadata = {
  title: "Create your store",
};

/**
 * Onboarding: lojista autenticado sem loja.
 * Já tem loja → manda direto para o dashboard.
 */
export default async function OnboardingPage() {
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
