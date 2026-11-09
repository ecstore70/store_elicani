import { Skeleton } from "@/components/ui/skeleton";
import { getTranslator } from "@/lib/i18n/locale";

/**
 * Estado de carregamento dos clientes — esqueleto da lista (nenhum
 * valor inventado enquanto a agregação corre).
 */
export default async function CustomersLoading() {
  const t = await getTranslator();

  return (
    <div className="space-y-6" aria-busy="true">
      <span className="sr-only">{t("common.loading")}</span>

      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="space-y-2">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-16 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
