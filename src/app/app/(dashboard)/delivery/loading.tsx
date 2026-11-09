import { Skeleton } from "@/components/ui/skeleton";
import { getTranslator } from "@/lib/i18n/locale";

/**
 * Estado de carregamento das entregas — esqueleto dos cartões de
 * contagem e da lista (nenhum valor inventado enquanto a consulta corre).
 */
export default async function DeliveryLoading() {
  const t = await getTranslator();

  return (
    <div className="space-y-6" aria-busy="true">
      <span className="sr-only">{t("common.loading")}</span>

      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-20 rounded-xl" />
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-8 w-24 rounded-md" />
        ))}
      </div>

      <div className="space-y-3">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-36 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
