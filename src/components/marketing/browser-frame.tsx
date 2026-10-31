import type { ReactNode } from "react";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Moldura de navegador para os visuais de produto do marketing.
 *
 * Decorativa: transmite "isto é um site real" sem capturar foco nem
 * interagir. O URL mostrado é o formato real das vitrines
 * (`{slug}.elicani.site`).
 */
export function BrowserFrame({
  url,
  className,
  bodyClassName,
  children,
}: {
  url: string;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-[0_24px_60px_-28px_rgba(15,23,42,0.35)]",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-slate-200/80 bg-slate-50 px-3 py-2.5">
        <span aria-hidden="true" className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-slate-300" />
          <span className="size-2.5 rounded-full bg-slate-300" />
          <span className="size-2.5 rounded-full bg-slate-300" />
        </span>
        <span className="mx-auto flex min-w-0 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1">
          <Lock aria-hidden="true" className="size-3 shrink-0 text-slate-400" />
          <span className="truncate text-[11px] font-medium text-slate-500">
            {url}
          </span>
        </span>
        <span aria-hidden="true" className="w-10 shrink-0" />
      </div>
      <div className={bodyClassName}>{children}</div>
    </div>
  );
}
