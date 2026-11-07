"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Loader2,
  Power,
  PowerOff,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { Locale } from "@/lib/i18n/config";
import { createTranslator } from "@/lib/i18n/translate";
import { deleteCatalogAction, setCatalogActiveAction } from "@/lib/stores/actions";
import {
  CATALOG_DELETE_WORD,
  isCatalogDeleteConfirmation,
} from "@/lib/stores/lifecycle";

type Notice = { kind: "success" | "error"; text: string };

/**
 * Se o erro é o NEXT_REDIRECT do framework (sessão expirada → /login),
 * a naveração já foi tratada pelo runtime — não é um erro para o usuário.
 */
function isRedirectError(error: unknown): boolean {
  const digest = (error as { digest?: unknown } | null)?.digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}

/**
 * Cartão de estado do catálogo + ações de ciclo de vida.
 *
 *  • Ativar/Desativar — server action grava `stores.is_active` (RLS +
 *    `.eq("owner_id")` no servidor); desativar pede confirmação (padrão
 *    `window.confirm` já usado em product-table/category-manager) explicando
 *    as 3 consequências;
 *  • Excluir — diálogo modal exige digitar DELETE antes do botão final
 *    (o servidor valida a palavra de novo);
 *  • Feedback: aviso inline (sucesso/erro) + `router.refresh()` implito na
 *    revalidação da própria resposta da action.
 */
export function CatalogManager({
  isActive,
  locale,
}: {
  isActive: boolean;
  locale: Locale;
}) {
  const t = createTranslator(locale);
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const applyState = (active: boolean) => {
    startTransition(async () => {
      try {
        const result = await setCatalogActiveAction(active);
        if (result.ok) {
          setNotice({
            kind: "success",
            text: active ? t("catalog.activated") : t("catalog.deactivated"),
          });
        } else {
          setNotice({ kind: "error", text: result.error ?? t("catalog.saveFailed") });
        }
      } catch (error) {
        if (isRedirectError(error)) return;
        setNotice({ kind: "error", text: t("catalog.saveFailed") });
      }
    });
  };

  const handleActivate = () => applyState(true);

  const handleDeactivate = () => {
    // Padrão do projeto (product-table, category-manager): confirmação
    // nativa com as consequências escritas — funciona em qualquer idioma.
    if (!window.confirm(t("catalog.deactivateConfirm"))) return;
    applyState(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("catalog.statusLabel")}</CardTitle>
          <CardDescription>
            {isActive
              ? t("catalog.activeDescription")
              : t("catalog.inactiveDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/70 bg-muted/40 px-4 py-3">
            <span className="text-sm font-medium">{t("dashboard.status")}</span>
            <Badge variant={isActive ? "default" : "secondary"}>
              {isActive ? t("dashboard.statusActive") : t("dashboard.statusInactive")}
            </Badge>
          </div>

          {notice && (
            <p
              role={notice.kind === "error" ? "alert" : "status"}
              aria-live="polite"
              className={
                notice.kind === "error"
                  ? "flex items-center gap-2 text-sm text-destructive"
                  : "flex items-center gap-2 text-sm text-emerald-600"
              }
            >
              {notice.kind === "error" ? (
                <TriangleAlert aria-hidden="true" className="size-4 shrink-0" />
              ) : (
                <CheckCircle2 aria-hidden="true" className="size-4 shrink-0" />
              )}
              {notice.text}
            </p>
          )}

          <Separator />

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            {isActive ? (
              <Button variant="outline" disabled={pending} onClick={handleDeactivate}>
                {pending ? (
                  <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                ) : (
                  <PowerOff aria-hidden="true" className="size-4" />
                )}
                {t("catalog.deactivate")}
              </Button>
            ) : (
              <Button variant="default" disabled={pending} onClick={handleActivate}>
                {pending ? (
                  <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                ) : (
                  <Power aria-hidden="true" className="size-4" />
                )}
                {t("catalog.activate")}
              </Button>
            )}
            <Button
              variant="destructive"
              disabled={pending}
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 aria-hidden="true" className="size-4" />
              {t("catalog.delete")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <DeleteCatalogDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        locale={locale}
      />
    </div>
  );
}

/**
 * Exclusão destrutiva: sem toque único. O botão final só habilita quando
 * o lojista digita exatamente DELETE (`isCatalogDeleteConfirmation`, o
 * mesmo portão que a server action revalida no servidor). Em sucesso,
 * encaminha para /app/onboarding?deleted=1 — a página de onboarding mostra
 * o aviso "catálogo excluído" e é o destino correto sem loja (o layout do
 * dashboard redirecionaria para lá de qualquer forma).
 */
function DeleteCatalogDialog({
  open,
  onOpenChange,
  locale,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale: Locale;
}) {
  const t = createTranslator(locale);
  const router = useRouter();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const confirmed = isCatalogDeleteConfirmation(text);

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    if (!next) {
      setText("");
      setError(null);
    }
  };

  const handleDelete = () => {
    if (!confirmed) return;
    startTransition(async () => {
      try {
        const result = await deleteCatalogAction(text);
        if (!result.ok) {
          setError(result.error ?? t("catalog.deleteFailed"));
          return;
        }
        // Sucesso → feedback na página de destino (banner ?deleted=1).
        router.push("/app/onboarding?deleted=1");
      } catch (err) {
        if (isRedirectError(err)) return;
        setError(t("catalog.deleteFailed"));
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("catalog.deleteTitle")}</DialogTitle>
          <DialogDescription>{t("catalog.deleteBody")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="catalog-delete-confirm">
            {t("catalog.deleteTypeConfirm")}
          </Label>
          <Input
            id="catalog-delete-confirm"
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              setError(null);
            }}
            placeholder={CATALOG_DELETE_WORD}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            aria-invalid={Boolean(error)}
          />
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            disabled={pending}
            onClick={() => handleOpenChange(false)}
          >
            {t("common.cancel")}
          </Button>
          <Button
            variant="destructive"
            disabled={!confirmed || pending}
            onClick={handleDelete}
          >
            {pending && (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            )}
            {t("catalog.deleteConfirmButton")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
