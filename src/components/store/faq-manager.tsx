"use client";

import { useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Loader2, Trash2 } from "lucide-react";
import { FormAlert } from "@/components/shared/form-alert";
import { Button } from "@/components/ui/button";
import { TextAreaField, TextField } from "@/components/store/fields";
import {
  createFaqItemAction,
  deleteFaqItemAction,
  moveFaqItemAction,
  updateFaqItemAction,
} from "@/lib/stores/actions";
import type { FaqItemFormState, PublicFaqItem } from "@/lib/stores/types";
import type { Locale } from "@/lib/i18n/config";
import { createTranslator } from "@/lib/i18n/translate";

const INITIAL_STATE: FaqItemFormState = {
  error: null,
  notice: null,
  fieldErrors: {},
};

/** Linha de FAQ — editar pergunta/resposta, deslocar ↑/↓ e remover. */
function FaqRow({
  item,
  index,
  total,
  locale,
  disabled,
  onTransition,
}: {
  item: PublicFaqItem;
  index: number;
  total: number;
  locale: Locale;
  disabled: boolean;
  onTransition: (work: () => Promise<void>) => void;
}) {
  const t = createTranslator(locale);
  const [state, formAction, pending] = useActionState(
    updateFaqItemAction.bind(null, item.id),
    INITIAL_STATE,
  );

  return (
    <li className="py-4">
      <div className="flex items-start gap-3">
        <form action={formAction} className="min-w-0 flex-1 space-y-3">
          <TextField
            label={t("faq.question")}
            name="question"
            defaultValue={item.question}
            placeholder={t("faq.questionPlaceholder")}
            disabled={pending || disabled}
            error={state.fieldErrors.question}
          />
          <TextAreaField
            label={t("faq.answer")}
            name="answer"
            defaultValue={item.answer}
            placeholder={t("faq.answerPlaceholder")}
            rows={3}
            disabled={pending || disabled}
            error={state.fieldErrors.answer}
          />

          <div className="flex flex-wrap items-center justify-between gap-2">
            {state.error ? (
              <p className="text-xs text-destructive">{state.error}</p>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-2">
              {state.notice && (
                <span className="sr-only" role="status">
                  {state.notice}
                </span>
              )}
              <Button
                type="submit"
                variant="outline"
                size="sm"
                disabled={pending || disabled}
                aria-label={`${t("faq.save")}: ${item.question}`}
              >
                {pending ? (
                  <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                ) : (
                  t("faq.save")
                )}
              </Button>
            </div>
          </div>
        </form>

        <div className="flex shrink-0 flex-col items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={disabled || index === 0}
            aria-label={`${t("faq.moveUp")}: ${item.question}`}
            onClick={() => onTransition(() => moveFaqItemAction(item.id, "up"))}
          >
            <ArrowUp aria-hidden="true" className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={disabled || index === total - 1}
            aria-label={`${t("faq.moveDown")}: ${item.question}`}
            onClick={() =>
              onTransition(() => moveFaqItemAction(item.id, "down"))
            }
          >
            <ArrowDown aria-hidden="true" className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={disabled}
            aria-label={`${t("faq.delete")}: ${item.question}`}
            className="text-muted-foreground hover:text-destructive"
            onClick={() => {
              if (
                !globalThis.window?.confirm(
                  t("faq.deleteConfirm", { name: item.question }),
                )
              ) {
                return;
              }
              onTransition(() => deleteFaqItemAction(item.id));
            }}
          >
            <Trash2 aria-hidden="true" className="size-4" />
          </Button>
        </div>
      </div>
    </li>
  );
}

/**
 * Gestor de FAQ da loja — criar + lista com edição/ordenação/remoção,
 * copiando o padrão de `category-manager.tsx` (ações vinculadas por id,
 * `useActionState` por linha, confirmação antes de apagar,
 * `router.refresh()` após mutações para a lista revalidar).
 */
export function FaqManager({
  items,
  locale,
}: {
  items: PublicFaqItem[];
  locale: Locale;
}) {
  const t = createTranslator(locale);
  const router = useRouter();
  const [createState, createFormAction, createPending] = useActionState(
    createFaqItemAction,
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
      <div className="space-y-1">
        <h2 className="text-sm font-semibold tracking-tight">
          {t("legal.faqFull")}
        </h2>
        <p className="text-sm text-muted-foreground">{t("faq.sectionHelp")}</p>
      </div>

      <form action={createFormAction} className="space-y-3">
        <TextField
          label={t("faq.question")}
          name="question"
          placeholder={t("faq.questionPlaceholder")}
          disabled={createPending}
          error={createState.fieldErrors.question}
        />
        <TextAreaField
          label={t("faq.answer")}
          name="answer"
          placeholder={t("faq.answerPlaceholder")}
          rows={3}
          disabled={createPending}
          error={createState.fieldErrors.answer}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={createPending}>
            {createPending ? t("common.loading") : t("faq.addQuestion")}
          </Button>
        </div>

        {createState.error && (
          <FormAlert tone="error">{createState.error}</FormAlert>
        )}
        {createState.notice && (
          <FormAlert tone="success">{createState.notice}</FormAlert>
        )}
      </form>

      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          {t("faq.empty")}
        </p>
      ) : (
        <ul className="divide-y divide-border/70">
          {items.map((item, index) => (
            <FaqRow
              key={item.id}
              item={item}
              index={index}
              total={items.length}
              locale={locale}
              disabled={createPending}
              onTransition={run}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
