import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { WhatsAppIcon } from "@/components/shared/whatsapp-icon";
import { CatalogUnavailable } from "@/components/storefront/catalog-unavailable";
import { StoreShell } from "@/components/storefront/store-shell";
import { formatCurrency } from "@/lib/currency";
import { normalizeLocale } from "@/lib/i18n/config";
import { getLocaleChoice, getTranslator } from "@/lib/i18n/locale";
import { createTranslator } from "@/lib/i18n/translate";
import type { MessageKey } from "@/lib/i18n/messages/en";
import { getOrderTracking } from "@/lib/orders/queries";
import { isUuid } from "@/lib/orders/search";
import {
  deliveryStatusSteps,
  isDeliveryInFlow,
  isOrderInFlow,
  orderStatusSteps,
  type StepState,
} from "@/lib/orders/tracking";
import { normalizeAppearance } from "@/lib/stores/appearance";
import { getPublicStoreBySlug, getPublicStoreStatus } from "@/lib/stores/queries";
import { resolveTheme, BUTTON_CLASSES } from "@/lib/storefront/theme";
import { buildStorefrontStrings } from "@/lib/storefront/strings";

type Props = { params: Promise<{ slug: string; orderId: string }> };

/** Resolve a loja no Supabase a cada requisição — rota dinâmica por natureza. */
export const instant = false;

/** Rótulo i18n de cada estado — nomes NUNCA fixos no código (i18n). */
const ORDER_LABEL_KEYS: Record<string, MessageKey> = {
  pending: "status.pending",
  confirmed: "status.confirmed",
  completed: "status.completed",
};
const DELIVERY_LABEL_KEYS: Record<string, MessageKey> = {
  pending: "delivery.statusPending",
  preparing: "delivery.statusPreparing",
  on_the_way: "delivery.statusOnTheWay",
  delivered: "delivery.statusDelivered",
};

/**
 * Página de SEGUIMENTO da encomenda — `/store/{slug}/order/{uuid}`.
 *
 * Capability URL: o uuid v4 (122 bits) é a autorização — por isso é
 * sempre noindex (nunca entra no sitemap nem em link crawlável) e o RPC
 * devolve só estado/totais/itens, NUNCA PII do cliente (nome, telefone,
 * morada, notas, pagamento).
 *
 * Regas de estado (mesmas da vitrine): loja INEXISTENTE ou encomenda
 * inexistente/de OUTRA loja → 404 real (o proxy confirma antes do render
 * — ramo 1f, armadilha do soft-404 sob PPR); loja INATIVA → estado
 * indisponível (200 + noindex); falha em aberto → 500 honesto.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, orderId } = await params;
  const noindex = { robots: { index: false, follow: false } } as const;

  if (!isUuid(orderId)) {
    const t = await getTranslator();
    return { title: t("storefront.notFound"), ...noindex };
  }

  const store = await getPublicStoreBySlug(slug);
  if (!store) {
    const t = await getTranslator();
    if ((await getPublicStoreStatus(slug)) === "inactive") {
      return { title: t("storefront.catalogUnavailable"), ...noindex };
    }
    return { title: t("storefront.notFound"), ...noindex };
  }

  // Sem `absolute`: a página é noindex e o visitante reconhece a aba
  // pelo nome da loja (mesmo racional do checkout).
  const visitorChoice = await getLocaleChoice();
  const locale = visitorChoice ?? normalizeLocale(store.language);
  const t = createTranslator(locale);
  return { title: `${t("orders.status")} · ${store.name}`, ...noindex };
}

/** Chip da linha do tempo — feito (contorno), atual (sólido), futuro. */
function stepClasses(state: StepState): string {
  const base =
    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium";
  if (state === "done") {
    return `${base} border border-[var(--sf-primary)] text-[var(--sf-primary)]`;
  }
  if (state === "current") {
    return `${base} bg-[var(--sf-primary)] text-[var(--sf-card)]`;
  }
  return `${base} border border-[var(--sf-card-border)] text-[var(--sf-muted)]`;
}

/** Fora do fluxo (cancelada / falhada) — aviso, não linha do tempo. */
function alertClasses(): string {
  return "mt-2 inline-flex rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive";
}

export default async function OrderTrackingPage({ params }: Props) {
  const { slug, orderId } = await params;
  if (!isUuid(orderId)) notFound();

  const store = await getPublicStoreBySlug(slug);
  if (!store) {
    if ((await getPublicStoreStatus(slug)) === "inactive") {
      return <CatalogUnavailable />;
    }
    notFound();
  }

  const order = await getOrderTracking(slug, orderId);
  if (!order) notFound();

  // Preferência explícita do visitante > idioma configurado pela loja.
  const visitorChoice = await getLocaleChoice();
  const locale = visitorChoice ?? normalizeLocale(store.language);
  const t = createTranslator(locale);
  const strings = buildStorefrontStrings(t);

  const appearance = normalizeAppearance(store);
  const theme = resolveTheme(appearance);

  const placedAt = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
  }).format(new Date(order.createdAt));
  const money = (value: number) => formatCurrency(value, store.currency, locale);

  const whatsappDigits = store.whatsapp_number?.replace(/\D/g, "") ?? "";
  const orderInFlow = isOrderInFlow(order.status);
  const deliveryInFlow = isDeliveryInFlow(order.deliveryStatus);

  return (
    <StoreShell
      store={store}
      locale={locale}
      languageLabel={t("locale.changeLanguage")}
      strings={strings}
      theme={theme}
    >
      <div className="mx-auto max-w-lg px-4 pb-12 pt-6 sm:px-0">
        <div className="rounded-[var(--sf-radius)] border border-[var(--sf-card-border)] bg-[var(--sf-card)] p-5 shadow-sm">
          <h1 className="text-lg font-semibold text-[var(--sf-fg)]">
            {t("storefront.orderHeading", { reference: order.reference })}
          </h1>
          <p className="mt-1 text-sm text-[var(--sf-muted)]">
            {t("storefront.orderPlaced", { date: placedAt })}
          </p>

          {/* estados: encomenda + entrega (dois eixos independentes) */}
          <div className="mt-5 space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--sf-muted)]">
                {t("orders.status")}
              </p>
              {orderInFlow ? (
                <ol className="mt-2 flex flex-wrap gap-1.5">
                  {orderStatusSteps(order.status).map((step) => (
                    <li key={step.value} className={stepClasses(step.state)}>
                      {step.state === "done" && (
                        <Check aria-hidden="true" className="size-3" />
                      )}
                      {t(ORDER_LABEL_KEYS[step.value])}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-2">
                  <span className={alertClasses()}>
                    {t("status.cancelled")}
                  </span>
                </p>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--sf-muted)]">
                {t("delivery.labelDelivery")}
              </p>
              {deliveryInFlow ? (
                <ol className="mt-2 flex flex-wrap gap-1.5">
                  {deliveryStatusSteps(order.deliveryStatus).map((step) => (
                    <li key={step.value} className={stepClasses(step.state)}>
                      {step.state === "done" && (
                        <Check aria-hidden="true" className="size-3" />
                      )}
                      {t(DELIVERY_LABEL_KEYS[step.value])}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-2">
                  <span className={alertClasses()}>
                    {t("delivery.statusFailed")}
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* resumo: o que foi pedido (o comprador reconhece a compra) */}
          <div className="mt-5 border-t border-[var(--sf-card-border)] pt-4">
            <h2 className="text-sm font-semibold text-[var(--sf-fg)]">
              {t("storefront.orderSummary")}
            </h2>
            <ul className="mt-2 space-y-2">
              {order.items.map((item, index) => (
                <li
                  key={`${item.name}-${index}`}
                  className="flex justify-between gap-3 text-sm"
                >
                  <span className="text-[var(--sf-fg)]">
                    <span className="text-[var(--sf-muted)]">{item.qty}×</span>{" "}
                    {item.name}
                    {item.options.length > 0 && (
                      <span className="block text-xs text-[var(--sf-muted)]">
                        {item.options
                          .map((option) => `${option.groupLabel}: ${option.choiceLabel}`)
                          .join(" · ")}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-[var(--sf-fg)]">
                    {money(item.unitPrice * item.qty)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-3 space-y-1 border-t border-[var(--sf-card-border)] pt-3 text-sm">
              <div className="flex justify-between text-[var(--sf-muted)]">
                <span>{t("storefront.subtotal")}</span>
                <span>{money(order.subtotal)}</span>
              </div>
              {order.deliveryFee !== null && (
                <div className="flex justify-between text-[var(--sf-muted)]">
                  <span>{t("delivery.fee")}</span>
                  <span>{money(order.deliveryFee)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-[var(--sf-fg)]">
                <span>{t("storefront.total")}</span>
                <span>{money(order.total)}</span>
              </div>
            </div>
          </div>

          <p className="mt-4 text-xs text-[var(--sf-muted)]">
            {t("storefront.orderTrackHint")}
          </p>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          {whatsappDigits.length >= 7 && (
            <a
              href={`https://wa.me/${whatsappDigits}`}
              target="_blank"
              rel="noopener noreferrer"
              className={BUTTON_CLASSES}
            >
              <WhatsAppIcon className="size-4" />
              {t("storefront.whatsappContact")}
            </a>
          )}
          <Link
            href={`/store/${store.slug}`}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-[var(--sf-btn-radius)] border border-[var(--sf-card-border)] px-4 py-2.5 text-sm font-medium text-[var(--sf-fg)] hover:bg-[var(--sf-surface)]"
          >
            {t("storefront.backToStore")}
          </Link>
        </div>
      </div>
    </StoreShell>
  );
}
