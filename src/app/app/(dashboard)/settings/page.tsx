import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/page-header";
import { StoreForm } from "@/components/store/store-form";
import { LocaleSelector } from "@/components/shared/locale-selector";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getLocale } from "@/lib/i18n/locale";
import { createTranslator } from "@/lib/i18n/translate";
import { requireStore } from "@/lib/stores/queries";

export async function generateMetadata(): Promise<Metadata> {
  const t = createTranslator(await getLocale());
  return { title: t("settings.title") };
}

export default async function SettingsPage() {
  const user = await requireUser();
  const store = await requireStore(user.id);

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
