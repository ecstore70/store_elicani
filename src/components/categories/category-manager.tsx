"use client";

import { useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Loader2,
  Trash2,
} from "lucide-react";
import { FormAlert } from "@/components/shared/form-alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  createCategoryAction,
  deleteCategoryAction,
  moveCategoryAction,
  setCategoryActiveAction,
  updateCategoryAction,
} from "@/lib/catalog/actions";
import type { CategoryFormState, PublicCategory } from "@/lib/catalog/types";
import type { Locale } from "@/lib/i18n/config";
import { createTranslator } from "@/lib/i18n/translate";

const INITIAL_STATE: CategoryFormState = {
  error: null,
  notice: null,
  fieldErrors: {},
  values: { name: "" },
};

/** Linha de categoria — renomear, ativar/deslocar/remover. */
function CategoryRow({
  category,
  index,
  total,
  locale,
  disabled,
  onTransition,
}: {
  category: PublicCategory;
  index: number;
  total: number;
  locale: Locale;
  disabled: boolean;
  onTransition: (work: () => Promise<void>) => void;
}) {
  const t = createTranslator(locale);
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    updateCategoryAction.bind(null, category.id),
    INITIAL_STATE,
  );

  return (
    <li className="flex items-center gap-3 py-3">
      <form action={formAction} className="flex min-w-0 flex-1 items-center gap-2">
        <div className="min-w-0 flex-1">
          <Label htmlFor={`category-${category.id}`} className="sr-only">
            {t("categories.name")}
          </Label>
          <Input
            id={`category-${category.id}`}
            name="name"
            defaultValue={category.name}
            disabled={pending || disabled}
            aria-invalid={state.fieldErrors.name ? true : undefined}
            className="h-8 max-w-xs"
          />
          {state.fieldErrors.name && (
            <p className="mt-1 text-xs text-destructive">
              {state.fieldErrors.name}
            </p>
          )}
        </div>
        <Button
          type="submit"
          variant="outline"
          size="sm"
          disabled={pending || disabled}
          aria-label={`${t("categories.save")}: ${category.name}`}
        >
          {pending ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            t("categories.save")
          )}
        </Button>
        {state.notice && (
          <span className="sr-only" role="status">
            {state.notice}
          </span>
        )}
      </form>

      <div className="flex shrink-0 items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={disabled || index === 0}
          aria-label={`${t("categories.moveUp")}: ${category.name}`}
          onClick={() => onTransition(() => moveCategoryAction(category.id, "up"))}
        >
          <ArrowUp aria-hidden="true" className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={disabled || index === total - 1}
          aria-label={`${t("categories.moveDown")}: ${category.name}`}
          onClick={() => onTransition(() => moveCategoryAction(category.id, "down"))}
        >
          <ArrowDown aria-hidden="true" className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={disabled}
          aria-pressed={category.is_active}
          aria-label={`${t("categories.active")}: ${category.name}`}
          className={category.is_active ? "text-emerald-600" : "text-muted-foreground"}
          onClick={() =>
            onTransition(() =>
              setCategoryActiveAction(category.id, !category.is_active).then(() =>
                router.refresh(),
              ),
            )
          }
        >
          <Check aria-hidden="true" className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={disabled}
          aria-label={`${t("categories.delete")}: ${category.name}`}
          className="text-muted-foreground hover:text-destructive"
          onClick={() => {
            if (
              !globalThis.window?.confirm(
                t("categories.deleteConfirm", { name: category.name }),
              )
            ) {
              return;
            }
            onTransition(() => deleteCategoryAction(category.id));
          }}
        >
          <Trash2 aria-hidden="true" className="size-4" />
        </Button>
      </div>
    </li>
  );
}

/** Gestor de categorias: criar + lista com edição/ordenação/estado. */
export function CategoryManager({
  categories,
  locale,
}: {
  categories: PublicCategory[];
  locale: Locale;
}) {
  const t = createTranslator(locale);
  const router = useRouter();
  const [createState, createFormAction, createPending] = useActionState(
    createCategoryAction,
    INITIAL_STATE,
  );
  const [, startTransition] = useTransition();

  const run = (work: () => Promise<void>) => {
    startTransition(async () => {
      await work();
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base tracking-tight">
            {t("categories.new")}
          </CardTitle>
          <CardDescription>{t("categories.newSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createFormAction} className="flex max-w-md gap-2">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="new-category" className="sr-only">
                {t("categories.name")}
              </Label>
              <Input
                id="new-category"
                name="name"
                placeholder={t("categories.namePlaceholder")}
                disabled={createPending}
                aria-invalid={createState.fieldErrors.name ? true : undefined}
              />
              {createState.fieldErrors.name && (
                <p className="text-xs text-destructive">
                  {createState.fieldErrors.name}
                </p>
              )}
            </div>
            <Button type="submit" disabled={createPending}>
              {createPending ? t("common.loading") : t("categories.add")}
            </Button>
          </form>

          {createState.error && (
            <div className="mt-3">
              <FormAlert tone="error">{createState.error}</FormAlert>
            </div>
          )}
          {createState.notice && (
            <div className="mt-3">
              <FormAlert tone="success">{createState.notice}</FormAlert>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base tracking-tight">
            {t("categories.title")}
          </CardTitle>
          <CardDescription>{t("categories.listHint")}</CardDescription>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {t("categories.empty")}
            </p>
          ) : (
            <ul className="divide-y divide-border/70">
              {categories.map((category, index) => (
                <CategoryRow
                  key={category.id}
                  category={category}
                  index={index}
                  total={categories.length}
                  locale={locale}
                  disabled={createPending}
                  onTransition={run}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
