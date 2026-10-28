import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Alerta inline de formulário.
 * `error` usa role="alert" (leitores de tela anunciam); `success` usa status.
 */
export function FormAlert({
  tone,
  children,
  className,
}: {
  tone: "error" | "success";
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-lg border px-3 py-2 text-sm leading-snug",
        tone === "error"
          ? "border-destructive/30 bg-destructive/5 text-destructive"
          : "border-emerald-200 bg-emerald-50 text-emerald-900",
        className,
      )}
    >
      {children}
    </div>
  );
}
