import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/page-header";
import { StoreForm } from "@/components/store/store-form";
import { PoliciesForm } from "@/components/store/policies-form";
import { FaqManager } from "@/components/store/faq-manager";
import { DomainsCard } from "@/components/store/domains-card";
import { LocaleSelector } from "@/components/shared/locale-selector";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getDomainsForStore } from "@/lib/domains/queries";
import { getLocale } from "@/lib/i18n/locale";
import { createTranslator } from "@/lib/i18n/translate";
import { getFaqItemsForStore, requireStore } from "@/lib/stores/queries";

export async function generateMetadata(): Promise<Metadata> {
  const t = createTranslator(await getLocale());
  return { title: t("settings.title") };
}

export default async function SettingsPage() {
  const user = await requireUser();
  const store = await requireStore(user.id);
  const faqItems = await getFaqItemsForStore(store.id);
  const domains = await getDomainsForStore(store.id);

  const locale = await getLocale();
  const t = createTranslator(locale);

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("settings.title")}
        description={t("settings.subtitle")}
      />

      <Card>
        <CardContent className="pt-6">
          <StoreForm
            locale={locale}
            mode="update"
            storeSlug={store.slug}
            initialValues={{
              name: store.name,
              whatsapp_number: store.whatsapp_number ?? "",
              phone_country_code: store.phone_country_code ?? "",
              country: store.country ?? "",
              language: store.language,
              currency: store.currency,
              description: store.description ?? "",
              timezone: store.timezone ?? "",
              primary_color: store.primary_color ?? "",
              logo_url: store.logo_url ?? "",
              favicon_url: store.favicon_url ?? "",
              banner_url: store.banner_url ?? "",
              opening_hours: store.opening_hours ?? "",
              instagram_url: store.instagram_url ?? "",
              facebook_url: store.facebook_url ?? "",
            }}
          />
        </CardContent>
      </Card>

      {/* Políticas e FAQ — conteúdo do COMERCIANTE que alimenta os links
          do rodapé da vitrine (aparecem só quando há conteúdo publicado)
          e as páginas /store/{slug}/terms|privacy|faq. */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base tracking-tight">
            {t("settings.sectionPolicies")}
          </CardTitle>
          <CardDescription>{t("settings.policiesHelp")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <PoliciesForm
            locale={locale}
            initialValues={{
              terms: store.terms ?? "",
              privacy_policy: store.privacy_policy ?? "",
            }}
          />
          <Separator />
          <FaqManager items={faqItems} locale={locale} />
        </CardContent>
      </Card>

      {/* Domínios próprios — verificação de posse por DNS TXT (Fase 2).
          O token exibido vem da linha do LOJISTA (loja ativa) via RLS;
          o lookup de verificação roda só no servidor. */}
      <DomainsCard locale={locale} domains={domains} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base tracking-tight">
            {t("settings.uiLanguage")}
          </CardTitle>
          <CardDescription>{t("settings.uiLanguageHelp")}</CardDescription>
        </CardHeader>
        <CardContent>
          <LocaleSelector
            current={locale}
            label={t("locale.changeLanguage")}
            className="w-full max-w-56"
          />
        </CardContent>
      </Card>
    </div>
  );
}
