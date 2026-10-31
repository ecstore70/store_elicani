import type { Metadata } from "next";
import { ArrowUpRight, Package, ShoppingCart, Users } from "lucide-react";
import { PageHeader, PageSection } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getCountryName } from "@/lib/countries";
import { formatNumber, getCurrencyLabel } from "@/lib/currency";
import { LOCALE_LABELS, normalizeLocale } from "@/lib/i18n/config";
import { getLocale } from "@/lib/i18n/locale";
import { createTranslator } from "@/lib/i18n/translate";
import { requireStore } from "@/lib/stores/queries";
import { storePublicUrl } from "@/lib/stores/resolve";

export async function generateMetadata(): Promise<Metadata> {
  const t = createTranslator(await getLocale());
  return { title: t("nav.dashboard") };
}

/**
 * Cartões de resumo são EXPLICITAMENTE placeholders das tabelas das próximas
 * fases: mostram o valor real de "zero registos" com a indicação de que a
 * secção ainda não existe. Nenhum dado é inventado nem fingido ler da base.
 */
const SUMMARY = [
  { labelKey: "dashboard.products", icon: Package },
  { labelKey: "dashboard.orders", icon: ShoppingCart },
  { labelKey: "dashboard.customers", icon: Users },
] as const;

function DetailRow({
  label,
  value,
  mono = false,
  href,
}: {
  label: string;
  value: string;
  mono?: boolean;
  href?: string;
}) {
  const classes = mono
    ? "min-w-0 truncate text-end font-mono text-xs text-foreground"
    : "min-w-0 truncate text-end text-sm font-medium";

  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt className="shrink-0 text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0">
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="inline-flex max-w-full items-center gap-1 text-sm font-medium underline-offset-4 hover:underline"
          >
            <span className="truncate">{value}</span>
            <ArrowUpRight
              aria-hidden="true"
              className="size-3.5 shrink-0 text-muted-foreground"
            />
          </a>
        ) : (
          <span className={classes}>{value}</span>
        )}
      </dd>
    </div>
  );
}

export default async function DashboardPage() {
  const user = await requireUser();
  const store = await requireStore(user.id);

  const locale = await getLocale();
  const t = createTranslator(locale);

  const notSet = t("dashboard.notSet");

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("dashboard.title")}
        description={t("dashboard.subtitle")}
      />

      <PageSection title={t("dashboard.summary")}>
        <div className="grid gap-4 sm:grid-cols-3">
          {SUMMARY.map((item) => (
            <Card key={item.labelKey}>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-muted-foreground">
                    {t(item.labelKey)}
                  </span>
                  <item.icon
                    aria-hidden="true"
                    className="size-4 text-muted-foreground"
                  />
                </div>
                <p className="text-2xl font-semibold tracking-tight">
                  {formatNumber(0, locale)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("dashboard.summaryPlaceholder")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </PageSection>

      <PageSection title={t("dashboard.storeCard")}>
        <Card>
          <CardContent>
            <dl className="divide-y divide-border/60">
              <DetailRow label={t("dashboard.storeName")} value={store.name} />

              <div className="flex items-center justify-between gap-4 py-3">
                <dt className="text-sm text-muted-foreground">
                  {t("dashboard.status")}
                </dt>
                <dd>
                  <Badge
                    variant={store.is_active ? "default" : "secondary"}
                    className="font-medium"
                  >
                    {store.is_active
                      ? t("dashboard.statusActive")
                      : t("dashboard.statusInactive")}
                  </Badge>
                </dd>
              </div>

              <DetailRow label={t("dashboard.slug")} value={store.slug} mono />
              <DetailRow
                label={t("dashboard.publicUrl")}
                value={storePublicUrl(store.slug)}
                href={storePublicUrl(store.slug)}
              />
              <DetailRow
                label={t("dashboard.currency")}
                value={`${store.currency} — ${getCurrencyLabel(store.currency, locale)}`}
              />
              <DetailRow
                label={t("dashboard.language")}
                value={`${store.language} — ${LOCALE_LABELS[normalizeLocale(store.language)]}`}
              />
              <DetailRow
                label={t("dashboard.whatsapp")}
                value={store.whatsapp_number ?? notSet}
              />
              <DetailRow
                label={t("dashboard.country")}
                value={
                  store.country
                    ? `${store.country} — ${getCountryName(store.country, locale)}`
                    : notSet
                }
              />
              <DetailRow
                label={t("dashboard.timezone")}
                value={store.timezone ?? notSet}
              />
            </dl>
          </CardContent>
        </Card>
      </PageSection>
    </div>
  );
}
