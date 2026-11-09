import { Skeleton } from "@/components/ui/skeleton";
import { getTranslator } from "@/lib/i18n/locale";

/**
 * Estado de carregamento dos relatórios — esqueleto fiel à composição
 * final (nada de valores inventados enquanto as consultas correm).
 */
export default async function ReportsLoading() {
  const t = await getTranslator();

  return (
    <div className="space-y-6" aria-busy="true">
      <span className="sr-only">{t("reports.loading")}</span>

      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-8 w-20 rounded-md" />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-24 rounded-xl" />
        ))}
      </div>

      <Skeleton className="h-56 rounded-xl" />
      <Skeleton className="h-56 rounded-xl" />

      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    </div>
  );
}
