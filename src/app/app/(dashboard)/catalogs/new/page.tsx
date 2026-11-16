import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StoreForm } from "@/components/store/store-form";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { DEFAULT_CURRENCY } from "@/lib/currency";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";
import { getLocale } from "@/lib/i18n/locale";
import { createTranslator } from "@/lib/i18n/translate";
import { getStoresForOwner } from "@/lib/stores/queries";

export async function generateMetadata(): Promise<Metadata> {
  const t = createTranslator(await getLocale());
  return { title: t("catalogs.create") };
}

/**
 * Criar OUTRO catálogo (multi-catalog) — o MESMO formulário essencial da
 * primeira loja (`StoreForm mode="create"`), dentro do shell do painel.
 *
 * Zero lojas → onboarding: a primeira loja mantém a experiência existente.
 * A criação é a server action `createStoreAction` — valida, grava, torna
 * a loja nova a ATIVA (cookie) e entra direto no dashboard dela. Sem conta
 * nova, sem sign-out: é a mesma sessão com N lojas.
 */
export default async function NewCatalogPage() {
  const user = await requireUser();
  const stores = await getStoresForOwner(user.id);
  if (stores.length === 0) {
    redirect("/app/onboarding");
  }

  const locale: Locale = await getLocale();
  const t = createTranslator(locale);

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("catalogs.create")}
        description={t("catalogs.createSubtitle")}
        action={
          <Button variant="ghost" size="sm" asChild>
            <Link href="/app/catalogs">
              <ArrowLeft aria-hidden="true" className="size-4" />
              {t("catalogs.back")}
            </Link>
          </Button>
        }
      />

      <div className="max-w-2xl rounded-2xl border border-border/70 bg-card p-6 shadow-sm sm:p-8">
        <StoreForm
          locale={locale}
          mode="create"
          // Sugestões, nunca amarrações — idêntico ao onboarding.
          initialValues={{
            language: locale ?? DEFAULT_LOCALE,
            currency: DEFAULT_CURRENCY,
          }}
        />
      </div>
    </div>
  );
}
