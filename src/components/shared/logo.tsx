import { ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Marca do Elicani: selo sólido + wordmark.
 * Sem gradiente nem glassmorphism — mesma linguagem visual da vitrine futura.
 */
export function Logo({
  className,
  markClassName,
  wordmarkClassName,
}: {
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        aria-hidden="true"
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-lg bg-foreground text-background",
          markClassName,
        )}
      >
        <ShoppingBag className="size-4" strokeWidth={2.25} />
      </span>
      <span
        className={cn(
          "text-[15px] font-semibold tracking-tight",
          wordmarkClassName,
        )}
      >
        Elicani
      </span>
    </span>
  );
}
