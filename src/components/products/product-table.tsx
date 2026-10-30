"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  Loader2,
  Pencil,
  ShoppingBag,
  Star,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  deleteProductAction,
  moveProductAction,
  setProductFlagAction,
} from "@/lib/catalog/actions";
import type { PublicProduct } from "@/lib/catalog/types";
import type { Locale } from "@/lib/i18n/config";
import { formatCurrency } from "@/lib/currency";
import { createTranslator } from "@/lib/i18n/translate";

/**
 * Lista de produtos com ordenação simples (↑/↓), destaque, disponibilidade,
 * edição e remoção — tudo na própria loja (RLS + `.eq("store_id")`).
 *
 * Sem drag-and-drop: mecanismo de ordenação simples e persistente.
 */
export function ProductTable({
  products,
  categories,
  currency,
  locale,
}: {
  products: PublicProduct[];
  categories: { id: string; name: string }[];
  currency: string;
  locale: Locale;
}) {
  const t = createTranslator(locale);
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const categoryName = (categoryId: string | null) =>
    categories.find((category) => category.id === categoryId)?.name ?? null;

  const toggleFlag = (product: PublicProduct, field: "is_featured" | "is_available") => {
    const next = field === "is_featured" ? !product.is_featured : !product.is_available;
    startTransition(async () => {
      await setProductFlagAction(product.id, field, next);
      router.refresh();
    });
  };

  const move = (product: PublicProduct, direction: "up" | "down") => {
    startTransition(async () => {
      await moveProductAction(product.id, direction);
      router.refresh();
    });
  };

  const remove = (product: PublicProduct) => {
    if (!globalThis.window?.confirm(t("products.deleteConfirm", { name: product.name }))) {
      return;
    }
    startTransition(async () => {
      await deleteProductAction(product.id);
      router.refresh();
    });
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <ul className="divide-y divide-border/70">
          {products.map((product, index) => {
            const category = categoryName(product.category_id);

            return (
              <li key={product.id} className="flex items-center gap-3 py-3">
                {product.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.image_url}
                    alt=""
                    className="size-11 shrink-0 rounded-md border border-border/70 object-cover"
                  />
                ) : (
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-md border border-border/70 bg-muted/40">
                    <ShoppingBag aria-hidden="true" className="size-4 text-muted-foreground" />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="truncate text-sm font-medium">{product.name}</p>
                    {product.is_featured && (
                      <Badge variant="secondary" className="gap-1">
                        <Star aria-hidden="true" className="size-3" />
                        {t("products.featured")}
                      </Badge>
                    )}
                    {!product.is_available && (
                      <Badge variant="outline">{t("products.unavailable")}</Badge>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {category ?? t("products.noCategory")} ·{" "}
                    {product.promo_price !== null ? (
                      <>
                        <span className="font-medium text-foreground">
                          {formatCurrency(product.promo_price, currency, locale)}
                        </span>{" "}
                        <span className="line-through">
                          {formatCurrency(product.price, currency, locale)}
                        </span>
                      </>
                    ) : (
                      formatCurrency(product.price, currency, locale)
                    )}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={pending || index === 0}
                    aria-label={`${t("products.moveUp")}: ${product.name}`}
                    onClick={() => move(product, "up")}
                  >
                    <ArrowUp aria-hidden="true" className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={pending || index === products.length - 1}
                    aria-label={`${t("products.moveDown")}: ${product.name}`}
                    onClick={() => move(product, "down")}
                  >
                    <ArrowDown aria-hidden="true" className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={pending}
                    aria-pressed={product.is_featured}
                    aria-label={`${t("products.featured")}: ${product.name}`}
                    onClick={() => toggleFlag(product, "is_featured")}
                    className={product.is_featured ? "text-amber-500" : "text-muted-foreground"}
                  >
                    <Star aria-hidden="true" className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={pending}
                    aria-label={`${t("products.available")}: ${product.name}`}
                    onClick={() => toggleFlag(product, "is_available")}
                    className={product.is_available ? "text-emerald-600" : "text-muted-foreground"}
                  >
                    {pending ? (
                      <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                    ) : (
                      <span aria-hidden="true" className="text-xs font-semibold">
                        {product.is_available ? "ON" : "OFF"}
                      </span>
                    )}
                  </Button>
                  <Button type="button" variant="ghost" size="icon-sm" asChild>
                    <Link
                      href={`/app/products/${product.id}`}
                      aria-label={`${t("products.edit")}: ${product.name}`}
                    >
                      <Pencil aria-hidden="true" className="size-4" />
                    </Link>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={pending}
                    aria-label={`${t("products.delete")}: ${product.name}`}
                    onClick={() => remove(product)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 aria-hidden="true" className="size-4" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
