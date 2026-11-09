import { Skeleton } from "@/components/ui/skeleton";
import { getTranslator } from "@/lib/i18n/locale";

/**
 * Estado de carregamento das encomendas — esqueleto da lista (nada de
 * valores inventados enquanto a consulta corre).
 */
export default async function OrdersLoading() {
  const t = await getTranslator();

  return (
    <div className="space-y-6" aria-busy="true">
      <span className="sr-only">{t("common.loading")}</span>

      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-8 w-20 rounded-md" />
        ))}
      </div>

      <div className="space-y-2">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-14 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
