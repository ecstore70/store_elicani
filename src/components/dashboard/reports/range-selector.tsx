import Link from "next/link";
import { Button } from "@/components/ui/button";
import { addDays, RANGE_PRESETS, type RangePreset, type ReportRange } from "@/lib/reports/date-range";
import type { MessageKey } from "@/lib/i18n/messages/en";
import type { Translator } from "@/lib/i18n/translate";

/** Rótulos dos presets — chaves i18n, nunca texto fixo. */
const PRESET_LABELS: Record<RangePreset, MessageKey> = {
  today: "reports.rangeToday",
  yesterday: "reports.rangeYesterday",
  last7: "reports.rangeLast7",
  last30: "reports.rangeLast30",
  this_month: "reports.rangeThisMonth",
  prev_month: "reports.rangePrevMonth",
};

/**
 * Seletor de período: presets são LINKS (`?range=…`) e o personalizado é
 * um formulário GET (`?from=…&to=…`) — sem JavaScript, o servidor resolve
 * os limites com `resolveRange` e os dados sempre refletem a URL.
 */
export function RangeSelector({
  t,
  range,
  todayKey,
}: {
  t: Translator;
  range: ReportRange;
  todayKey: string;
}) {
  // O formulário mostra o intervalo INCLUSIVO (o `to` do período é exclusivo).
  const inclusiveEnd = addDays(range.fromKey, range.days - 1);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <nav
        aria-label={t("reports.rangeLabel")}
        className="flex flex-wrap gap-2"
      >
        {RANGE_PRESETS.map((preset) => (
          <Button
            key={preset}
            asChild
            size="sm"
            variant={range.preset === preset ? "default" : "outline"}
          >
            <Link href={`/app/reports?range=${preset}`}>
              {t(PRESET_LABELS[preset])}
            </Link>
          </Button>
        ))}
      </nav>

      <form
        method="get"
        action="/app/reports"
        className="flex flex-wrap items-center gap-2"
      >
        <label htmlFor="report-range-from" className="sr-only">
          {t("reports.rangeFrom")}
        </label>
        <input
          id="report-range-from"
          type="date"
          name="from"
          defaultValue={range.fromKey}
          max={todayKey}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        />
        <span aria-hidden="true" className="text-muted-foreground">
          –
        </span>
        <label htmlFor="report-range-to" className="sr-only">
          {t("reports.rangeTo")}
        </label>
        <input
          id="report-range-to"
          type="date"
          name="to"
          defaultValue={inclusiveEnd}
          max={todayKey}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        />
        <Button type="submit" size="sm" variant="outline">
          {t("reports.rangeApply")}
        </Button>
      </form>
    </div>
  );
}
