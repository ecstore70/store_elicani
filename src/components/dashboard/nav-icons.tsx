import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingCart,
  Truck,
  Users,
} from "lucide-react";
import type { NavIconName } from "./nav-items";

/**
 * Registo de ícones na camada CLIENTE.
 *
 * O servidor envia apenas o `NavIconName` (string serializável); o componente
 * real é importado aqui. Esta separação é obrigatória: componentes React não
 * podem ser passados como props de servidor para cliente.
 */
export const NAV_ICONS: Record<NavIconName, LucideIcon> = {
  dashboard: LayoutDashboard,
  products: Package,
  orders: ShoppingCart,
  customers: Users,
  delivery: Truck,
  reports: BarChart3,
  settings: Settings,
};
