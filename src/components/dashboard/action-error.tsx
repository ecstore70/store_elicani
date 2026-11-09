import { AlertCircle } from "lucide-react";

/**
 * Banner de ERRO de ação (guardar estado, etc.) — `?error=1` na URL.
 * Partilhado por Encomendas/Entrega; funciona sem JavaScript porque o
 * servidor redireciona de volta com o parâmetro.
 */
export function ActionError({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
    >
      <AlertCircle aria-hidden="true" className="size-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
