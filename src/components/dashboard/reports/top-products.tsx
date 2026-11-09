import { formatCurrency, formatNumber } from "@/lib/currency";
import type { Locale } from "@/lib/i18n/config";
import type { TopProduct } from "@/lib/reports/aggregate";
import type { Translator } from "@/lib/i18n/translate";

/**
 * Produtos mais vendidos do período — lista ranqueada (não tabela):
 * duas colunas já servem em 320px e nada transborda na horizontal.
 * Ordenação padrão = unidades vendidas (melhores vendedores primeiro).
 */
export function TopProducts({
  products,
  t,
  locale,
  currency,
}: {
  products: readonly TopProduct[];
  t: Translator;
  locale: Locale;
  currency: string;
}) {
  if (products.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{t("reports.empty")}</p>
    );
  }

  return (
    <ol className="divide-y divide-border rounded-lg border border-border bg-card">
      {products.map((product, index) => (
        <li
          key={product.key}
          className="flex items-center gap-3 px-4 py-3"
        >
          <span
            aria-hidden="true"
            className="w-4 shrink-0 text-sm text-muted-foreground"
          >
            {index + 1}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{product.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatNumber(product.qty, locale)} {t("reports.units")} ·{" "}
              {formatNumber(product.share, locale, {
                style: "percent",
                maximumFractionDigits: 0,
              })}{" "}
              {t("reports.share")}
            </p>
          </div>
          <span className="shrink-0 text-sm font-medium tabular-nums">
            {formatCurrency(product.revenue, currency, locale)}
          </span>
        </li>
      ))}
    </ol>
  );
}
