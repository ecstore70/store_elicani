import { Skeleton } from "@/components/ui/skeleton";

/** Estado de carregamento da área /app — espelha o dashboard sem inventar dados. */
export default function AppLoading() {
  return (
    <div className="space-y-8" aria-busy="true">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
      </div>

      <Skeleton className="h-72 rounded-xl" />
    </div>
  );
}
