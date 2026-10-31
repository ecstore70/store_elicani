import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Coins, LayoutGrid, MessageCircle, Settings, Store, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  HeroStorefront,
  StorefrontSectionVisual,
} from "@/components/marketing/storefront-visual";
import { DashboardMock } from "@/components/marketing/dashboard-mock";
import { getLocale } from "@/lib/i18n/locale";
import { createTranslator } from "@/lib/i18n/translate";
import type { MessageKey } from "@/lib/i18n/messages/en";
import { cn } from "@/lib/utils";

/**
 * Landing pública da Elicani.
 *
 * Structure (spec de landing):
 *  1. hero (2 colunas)      2. trust strip        3. features (6)
 *  4. como funciona (3)     5. showcase da vitrine (componentes REAIS)
 *  6. preview do dashboard  7. CTA final
 *
 * Toda a copy vem das chaves `landing.*` via o tradutor existente — nada de
 * texto em inglês/português hardcoded nos componentes. Os visuais de produto
 * reutilizam os componentes reais da vitrine (`ProductCard`,
 * `StorefrontCatalog`) em modo somente leitura, com conteúdo de amostra que
 * NÃO passa pela tradução (camada de conteúdo do comerciante).
 */

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const FEATURES: readonly {
  icon: typeof Store;
  titleKey: MessageKey;
  bodyKey: MessageKey;
}[] = [
  {
    icon: Store,
    titleKey: "landing.feature1Title",
    bodyKey: "landing.feature1Body",
  },
  {
    icon: LayoutGrid,
    titleKey: "landing.feature2Title",
    bodyKey: "landing.feature2Body",
  },
  {
    icon: MessageCircle,
    titleKey: "landing.feature3Title",
    bodyKey: "landing.feature3Body",
  },
  {
    icon: Coins,
    titleKey: "landing.feature4Title",
    bodyKey: "landing.feature4Body",
  },
  {
    icon: Truck,
    titleKey: "landing.feature5Title",
    bodyKey: "landing.feature5Body",
  },
  {
    icon: Settings,
    titleKey: "landing.feature6Title",
    bodyKey: "landing.feature6Body",
  },
];

const STEPS: readonly { n: string; titleKey: MessageKey; bodyKey: MessageKey }[] =
  [
    { n: "01", titleKey: "landing.step1Title", bodyKey: "landing.step1Body" },
    { n: "02", titleKey: "landing.step2Title", bodyKey: "landing.step2Body" },
    { n: "03", titleKey: "landing.step3Title", bodyKey: "landing.step3Body" },
  ];

const TRUST: readonly MessageKey[] = [
  "landing.trust1",
  "landing.trust2",
  "landing.trust3",
  "landing.trust4",
  "landing.trust5",
];

const STEP_NUMBER_CLASSES = [
  "text-slate-400",
  "text-brand-primary/50",
  "text-brand-primary",
] as const;

const STEP_BORDER_CLASSES = [
  "border-border",
  "border-brand-primary/30",
  "border-brand-primary",
] as const;

/** Checks reutilizáveis nas secções de preview. */
function CheckList({
  labels,
  className,
}: {
  labels: string[];
  className?: string;
}) {
  return (
    <ul className={cn("space-y-2.5 text-sm", className)}>
      {labels.map((label) => (
        <li key={label} className="flex items-center gap-2.5">
          <Check
            aria-hidden="true"
            className="size-4 shrink-0 text-brand-primary"
            strokeWidth={2.5}
          />
          <span className="text-muted-foreground">{label}</span>
        </li>
      ))}
    </ul>
  );
}

export default async function LandingPage() {
  const locale = await getLocale();
  const t = createTranslator(locale);

  return (
    <>
      {/* ── 1. Hero ─────────────────────────────────────────────────────── */}
      <section aria-labelledby="hero-title" className="pt-12 sm:pt-14 lg:pt-16">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 pb-16 sm:px-6 sm:pb-20 lg:grid-cols-[1.05fr_1fr] lg:gap-12 lg:px-8 lg:pb-24">
          <div className="max-w-xl">
            <h1
              id="hero-title"
              className="text-4xl font-semibold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-[3.4rem]"
            >
              <span className="block">{t("landing.heroTitle1")}</span>
              <span className="block">{t("landing.heroTitle2")}</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {t("landing.heroSubtitle")}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                className="h-12 w-full bg-brand-primary px-6 text-base text-white hover:bg-brand-primary/90 sm:w-auto"
                asChild
              >
                <Link href="/signup">
                  {t("landing.createStore")}
                  <ArrowRight
                    data-icon="inline-end"
                    aria-hidden="true"
                    className="size-4 rtl:rotate-180"
                  />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 w-full px-6 text-base sm:w-auto"
                asChild
              >
                <Link href="/#how-it-works">{t("landing.seeHow")}</Link>
              </Button>
            </div>
          </div>

          <HeroStorefront locale={locale} />
        </div>
      </section>

      {/* ── 2. Trust strip ──────────────────────────────────────────────── */}
      <section
        aria-label={t("landing.trust1")}
        className="border-y border-border/70 bg-brand-background"
      >
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
          <ul className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2.5 text-sm text-muted-foreground">
            {TRUST.map((key) => (
              <li key={key} className="flex items-center gap-2">
                <Check
                  aria-hidden="true"
                  className="size-4 shrink-0 text-brand-primary"
                  strokeWidth={2.5}
                />
                <span>{t(key)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── 3. Features ─────────────────────────────────────────────────── */}
      <section
        id="features"
        aria-labelledby="features-title"
        className="scroll-mt-20 py-16 sm:py-20"
      >
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2
              id="features-title"
              className="text-2xl font-semibold tracking-tight sm:text-3xl"
            >
              {t("landing.featuresTitle")}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">
              {t("landing.featuresSubtitle")}
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <Card
                key={feature.titleKey}
                className="rounded-lg py-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-24px_rgba(37,99,235,0.45)] hover:ring-brand-primary/30"
              >
                <CardHeader className="gap-3 px-5">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary">
                    <feature.icon aria-hidden="true" className="size-5" />
                  </span>
                  <CardTitle className="font-semibold">
                    {t(feature.titleKey)}
                  </CardTitle>
                  <CardDescription className="leading-relaxed">
                    {t(feature.bodyKey)}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. Como funciona ────────────────────────────────────────────── */}
      <section
        id="how-it-works"
        aria-labelledby="how-title"
        className="scroll-mt-20 border-y border-border/70 bg-brand-background py-16 sm:py-20"
      >
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2
              id="how-title"
              className="text-2xl font-semibold tracking-tight sm:text-3xl"
            >
              {t("landing.howTitle")}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">
              {t("landing.howSubtitle")}
            </p>
          </div>

          <ol className="mt-10 grid gap-8 md:grid-cols-3 md:gap-10">
            {STEPS.map((step, index) => (
              <li
                key={step.n}
                className={cn(
                  "border-t-2 pt-5",
                  STEP_BORDER_CLASSES[index],
                )}
              >
                <span
                  className={cn(
                    "text-2xl font-semibold tracking-tight",
                    STEP_NUMBER_CLASSES[index],
                  )}
                >
                  {step.n}
                </span>
                <h3 className="mt-2 text-lg font-semibold tracking-tight">
                  {t(step.titleKey)}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {t(step.bodyKey)}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── 5. Showcase da vitrine ──────────────────────────────────────── */}
      <section
        aria-labelledby="preview-store-title"
        className="py-16 sm:py-20"
      >
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2
              id="preview-store-title"
              className="text-2xl font-semibold tracking-tight sm:text-3xl"
            >
              {t("landing.previewStoreTitle")}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              {t("landing.previewStoreBody")}
            </p>
            <CheckList
              labels={[
                t("landing.trust1"),
                t("landing.trust2"),
                t("landing.trust3"),
              ]}
              className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5 space-y-0"
            />
          </div>

          <div className="mt-10">
            <StorefrontSectionVisual locale={locale} />
          </div>
        </div>
      </section>

      {/* ── 6. Preview do dashboard ─────────────────────────────────────── */}
      <section
        aria-labelledby="preview-dash-title"
        className="border-t border-border/70 bg-brand-background py-16 sm:py-20"
      >
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-12 lg:px-8">
          <DashboardMock locale={locale} />

          <div className="max-w-md">
            <h2
              id="preview-dash-title"
              className="text-2xl font-semibold tracking-tight sm:text-3xl"
            >
              {t("landing.previewDashTitle")}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              {t("landing.previewDashBody")}
            </p>
            <CheckList
              labels={[
                t("nav.products"),
                t("nav.orders"),
                t("nav.customers"),
                t("nav.delivery"),
                t("nav.settings"),
              ]}
              className="mt-6"
            />
          </div>
        </div>
      </section>

      {/* ── 7. CTA final ────────────────────────────────────────────────── */}
      <section aria-labelledby="cta-title" className="py-16 sm:py-20">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl bg-brand-dark px-6 py-14 text-center sm:px-12 sm:py-16">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -end-8 -top-8 opacity-[0.08]"
            >
              <Logo markOnly className="h-36 w-36 sm:h-48 sm:w-48" />
            </span>

            <div className="relative">
              <h2
                id="cta-title"
                className="text-2xl font-semibold tracking-tight text-white sm:text-3xl"
              >
                {t("landing.ctaTitle")}
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-300 sm:text-base">
                {t("landing.ctaBody")}
              </p>
              <div className="mt-8 flex justify-center">
                <Button
                  className="h-12 bg-brand-primary px-7 text-base text-white hover:bg-brand-primary/90"
                  asChild
                >
                  <Link href="/signup">
                    {t("landing.createStore")}
                    <ArrowRight
                      data-icon="inline-end"
                      aria-hidden="true"
                      className="size-4 rtl:rotate-180"
                    />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
