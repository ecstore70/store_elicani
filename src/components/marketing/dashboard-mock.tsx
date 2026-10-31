import type { Locale } from "@/lib/i18n/config";
import { formatCurrency } from "@/lib/currency";
import { createTranslator } from "@/lib/i18n/translate";
import { Logo } from "@/components/shared/logo";
import { NAV_ICONS } from "@/components/dashboard/nav-icons";
import { buildNavItems } from "@/components/dashboard/nav-items";
import { cn } from "@/lib/utils";
import { BrowserFrame } from "./browser-frame";
import { SAMPLE_ORDERS, SAMPLE_STORE } from "./sample-store";

/**
 * Preview do painel do comerciante — visual estático e decorativo
 * (`aria-hidden`, sem links focáveis) que reutiliza a navegação REAL
 * (`buildNavItems` + `NAV_ICONS`) e as chaves i18n existentes.
 *
 * Amostra sem dados pessoais: apenas IDs de encomenda, contagens e totais.
 */

const STATUS_CLASSES: Record<string, string> = {
  "landing.statusNew": "bg-blue-50 text-blue-700",
  "landing.statusConfirmed": "bg-amber-50 text-amber-700",
  "landing.statusDelivered": "bg-emerald-50 text-emerald-700",
};

const STATS = [
  { labelKey: "nav.products", value: "24" },
  { labelKey: "nav.orders", value: "12" },
  { labelKey: "nav.customers", value: "48" },
] as const;

export function DashboardMock({ locale }: { locale: Locale }) {
  const t = createTranslator(locale);
  const items = buildNavItems(t);

  return (
    <div aria-hidden="true">
      <BrowserFrame url="app.elicani.site/app" bodyClassName="bg-slate-50">
        <div className="flex min-h-[360px]">
          <aside className="hidden w-40 shrink-0 border-r border-border/70 bg-sidebar p-3 sm:block">
            <div className="mb-3 flex items-center gap-2 px-1.5">
              <Logo markOnly className="h-4.5" />
              <span className="text-[13px] font-semibold">Elicani</span>
            </div>
            <ul className="space-y-0.5">
              {items.map((item) => {
                const Icon = NAV_ICONS[item.icon];
                return (
                  <li
                    key={item.href}
                    className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] text-muted-foreground"
                  >
                    <Icon aria-hidden="true" className="size-3.5 shrink-0" />
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    {!item.ready && (
                      <span className="shrink-0 rounded border border-border/60 px-1 py-px text-[10px] font-medium">
                        {t("common.comingSoon")}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </aside>

          <div className="min-w-0 flex-1 p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold">{t("nav.dashboard")}</p>
              <span className="flex size-7 items-center justify-center rounded-full bg-brand-primary text-xs font-semibold text-white">
                N
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {STATS.map((stat) => (
                <div
                  key={stat.labelKey}
                  className="rounded-lg border border-border/70 bg-card p-3"
                >
                  <p className="truncate text-[11px] text-muted-foreground">
                    {t(stat.labelKey)}
                  </p>
                  <p className="mt-1 text-xl font-semibold tracking-tight">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-3 overflow-hidden rounded-lg border border-border/70 bg-card">
              <div className="border-b border-border/70 px-3 py-2.5">
                <p className="text-xs font-semibold">{t("nav.orders")}</p>
              </div>
              <table className="w-full text-start text-xs">
                <thead className="text-[11px] text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">
                      {t("landing.colOrder")}
                    </th>
                    <th className="hidden px-3 py-2 font-medium sm:table-cell">
                      {t("landing.colItems")}
                    </th>
                    <th className="px-3 py-2 font-medium">
                      {t("landing.colTotal")}
                    </th>
                    <th className="px-3 py-2 font-medium">
                      {t("landing.colStatus")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {SAMPLE_ORDERS.map((order) => (
                    <tr key={order.id} className="border-t border-border/70">
                      <td className="px-3 py-2.5 font-medium">{order.id}</td>
                      <td className="hidden px-3 py-2.5 text-muted-foreground sm:table-cell">
                        {order.items === 1
                          ? t("landing.demoItemsOne", { count: order.items })
                          : t("landing.demoItemsMany", { count: order.items })}
                      </td>
                      <td className="px-3 py-2.5">
                        {formatCurrency(order.total, SAMPLE_STORE.currency, locale)}
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium",
                            STATUS_CLASSES[order.status] ??
                              "bg-slate-100 text-slate-700",
                          )}
                        >
                          {t(order.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </BrowserFrame>
    </div>
  );
}
