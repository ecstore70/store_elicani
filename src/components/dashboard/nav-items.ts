import type { Translator } from "@/lib/i18n/translate";
import type { MessageKey } from "@/lib/i18n/messages/en";

/**
 * Identificador serializável do ícone.
 *
 * Componentes React NÃO atravessam a fronteira servidor → cliente; apenas
 * dados. Cada item carrega o nome e o cliente resolve o componente importado
 * localmente (ver `nav-icons.tsx`).
 */
export type NavIconName =
  | "dashboard"
  | "products"
  | "orders"
  | "customers"
  | "delivery"
  | "reports"
  | "settings";

export type NavItem = {
  href: string;
  labelKey: MessageKey;
  icon: NavIconName;
  /** Funcional na Fase 1 — as restantes mostram "Coming soon". */
  ready: boolean;
};

/**
 * Navegação do painel. Os rótulos são CHAVES i18n: cada idioma traduz
 * sem tocar neste ficheiro.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/app", labelKey: "nav.dashboard", icon: "dashboard", ready: true },
  { href: "/app/products", labelKey: "nav.products", icon: "products", ready: false },
  { href: "/app/orders", labelKey: "nav.orders", icon: "orders", ready: false },
  { href: "/app/customers", labelKey: "nav.customers", icon: "customers", ready: false },
  { href: "/app/delivery", labelKey: "nav.delivery", icon: "delivery", ready: false },
  { href: "/app/reports", labelKey: "nav.reports", icon: "reports", ready: false },
  { href: "/app/settings", labelKey: "nav.settings", icon: "settings", ready: true },
];

/** Item já traduzido — o que atravessa a fronteira servidor → cliente. */
export type NavItemView = {
  href: string;
  label: string;
  icon: NavIconName;
  ready: boolean;
};

export function buildNavItems(t: Translator): NavItemView[] {
  return NAV_ITEMS.map((item) => ({
    href: item.href,
    label: t(item.labelKey),
    icon: item.icon,
    ready: item.ready,
  }));
}
