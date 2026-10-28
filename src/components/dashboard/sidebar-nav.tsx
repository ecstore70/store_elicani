"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { NAV_ICONS } from "./nav-icons";
import type { NavItemView } from "./nav-items";

/**
 * Lista de navegação usada na barra lateral (desktop) e na gaveta (mobile).
 * O estado ativo vem do pathname real — nunca de valor fixo na UI.
 */
export function SidebarNav({
  items,
  onNavigate,
}: {
  items: NavItemView[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <ul className="space-y-0.5">
      {items.map((item) => {
        const active = pathname === item.href;
        const Icon = NAV_ICONS[item.icon];

        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors",
                active
                  ? "bg-accent font-medium text-foreground"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
              )}
            >
              <Icon aria-hidden="true" className="size-4 shrink-0" />
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              {!item.ready && (
                <Badge
                  variant="outline"
                  className="shrink-0 border-border/60 px-1.5 font-normal text-muted-foreground"
                >
                  Soon
                </Badge>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
