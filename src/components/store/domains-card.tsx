"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Globe, Loader2, ShieldCheck, Trash2 } from "lucide-react";
import { FormAlert } from "@/components/shared/form-alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TextField } from "@/components/store/fields";
import {
  addDomainAction,
  removeDomainAction,
  verifyDomainAction,
} from "@/lib/domains/actions";
import {
  EMPTY_DOMAIN_STATE,
  FAILURE_MESSAGE_KEYS,
  type DomainFormState,
  type DomainSummary,
} from "@/lib/domains/types";
import { buildTxtName, type VerifyFailure } from "@/lib/domains/verify";
import type { Locale } from "@/lib/i18n/config";
import { createTranslator } from "@/lib/i18n/translate";
import type { MessageKey } from "@/lib/i18n/messages/en";

/** Badge de status: âmbar pendente / esmeralda verificado (tom do FormAlert). */
const PENDING_BADGE =
  "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200";
const ACTIVE_BADGE =
  "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200";

/** `last_error` gravado no banco → chave i18n (código desconhecido → null). */
function lastErrorMessageKey(domain: DomainSummary): MessageKey | null {
  if (domain.status === "active" || !domain.last_error) return null;
  return domain.last_error in FAILURE_MESSAGE_KEYS
    ? FAILURE_MESSAGE_KEYS[domain.last_error as VerifyFailure]
    : null;
}

/**
 * Linha de um domínio: badge de status, instruções TXT (nome + token com
 * cópia) enquanto pendente, botões Verificar/Remover sempre visíveis
 * (ação com rótulo de texto — nada só de hover, funciona no toque).
 */
function DomainRow({
  domain,
  locale,
  disabled,
  onRemoved,
}: {
  domain: DomainSummary;
  locale: Locale;
  disabled: boolean;
  onRemoved: (notice: string) => void;
}) {
  const t = createTranslator(locale);
  const router = useRouter();
  const [state, setState] = useState<DomainFormState>(EMPTY_DOMAIN_STATE);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const isActive = domain.status === "active";
  const txtName = buildTxtName(domain.hostname);
  const errorKey = lastErrorMessageKey(domain);

  const run = (work: () => Promise<DomainFormState>) => {
    startTransition(async () => {
      const result = await work();
      setState(result);
      router.refresh();
    });
  };

  const doRemove = () => {
    if (
      !globalThis.window?.confirm(
        t("domains.removeConfirm", { name: domain.hostname }),
      )
    ) {
      return;
    }
    startTransition(async () => {
      const result = await removeDomainAction(domain.id);
      if (result.notice) {
        // Sucesso: a linha some e o aviso sube para o card.
        onRemoved(result.notice);
      } else {
        setState(result);
      }
      router.refresh();
    });
  };

  const copy = async (field: "name" | "value", value: string) => {
    try {
      if (!navigator.clipboard) return;
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      globalThis.setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // Área não segura ou permissão negada: silencioso, o valor fica visível.
    }
  };

  return (
    <li className="space-y-3 py-4 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Globe aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate text-sm font-medium">{domain.hostname}</span>
          <Badge variant="outline" className={isActive ? ACTIVE_BADGE : PENDING_BADGE}>
            {isActive ? t("domains.statusActive") : t("domains.statusPending")}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {!isActive && (
            <Button
              type="button"
              size="sm"
              disabled={disabled || pending}
              onClick={() => run(() => verifyDomainAction(domain.id))}
            >
              {pending ? (
                <Loader2 aria-hidden="true" className="animate-spin" />
              ) : (
                <ShieldCheck aria-hidden="true" />
              )}
              {pending
                ? t("domains.checking")
                : domain.last_error
                  ? t("domains.retryVerify")
                  : t("domains.verify")}
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={disabled || pending}
            className="text-muted-foreground hover:text-destructive"
            onClick={doRemove}
          >
            <Trash2 aria-hidden="true" />
            {t("domains.remove")}
          </Button>
        </div>
      </div>

      {!isActive && (
        <div className="space-y-2 rounded-lg border bg-muted/40 p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="block text-xs font-medium text-muted-foreground">
                {t("domains.txtName")}
              </span>
              <code className="block truncate text-xs">{txtName}</code>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`${t("domains.copy")}: ${t("domains.txtName")}`}
              onClick={() => copy("name", txtName)}
            >
              {copiedField === "name" ? (
                <Check aria-hidden="true" className="text-emerald-600" />
              ) : (
                <Copy aria-hidden="true" />
              )}
            </Button>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="block text-xs font-medium text-muted-foreground">
                {t("domains.txtValue")}
              </span>
              <code className="block break-all text-xs">
                {domain.verification_token}
              </code>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`${t("domains.copy")}: ${t("domains.txtValue")}`}
              onClick={() => copy("value", domain.verification_token)}
            >
              {copiedField === "value" ? (
                <Check aria-hidden="true" className="text-emerald-600" />
              ) : (
                <Copy aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>
      )}

      {state.error && <FormAlert tone="error">{state.error}</FormAlert>}
      {state.notice && <FormAlert tone="success">{state.notice}</FormAlert>}
      {!state.error && errorKey && (
        <FormAlert tone="error">{t(errorKey)}</FormAlert>
      )}
    </li>
  );
}

/**
 * Card de domínios próprios em /app/settings — fluxo completo de
 * verificação por DNS TXT (Fase 2): adicionar claim pendente, ver as
 * instruções do registro `_elicaniverify.<host>` com o token do banco,
 * verificar (lookup server-side) e remover. Os dados vêm do servidor com
 * a sessão do lojista (loja ATIVA do multi-catalog); as actions revalidam
 * a página para o card refrescar.
 */
export function DomainsCard({
  locale,
  domains,
}: {
  locale: Locale;
  domains: DomainSummary[];
}) {
  const t = createTranslator(locale);
  const [addState, addFormAction, addPending] = useActionState(
    addDomainAction,
    EMPTY_DOMAIN_STATE,
  );
  const [listNotice, setListNotice] = useState<string | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base tracking-tight">
          {t("domains.title")}
        </CardTitle>
        <CardDescription>{t("domains.help")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form action={addFormAction} className="space-y-3">
          <TextField
            label={t("domains.hostnameLabel")}
            name="hostname"
            placeholder={t("domains.hostnamePlaceholder")}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            disabled={addPending}
            error={addState.fieldErrors.hostname}
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={addPending}>
              {addPending ? t("common.loading") : t("domains.add")}
            </Button>
          </div>
          {addState.error && (
            <FormAlert tone="error">{addState.error}</FormAlert>
          )}
          {addState.notice && (
            <FormAlert tone="success">{addState.notice}</FormAlert>
          )}
        </form>

        {listNotice && (
          <FormAlert tone="success">{listNotice}</FormAlert>
        )}

        {domains.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {t("domains.empty")}
          </p>
        ) : (
          <ul className="divide-y divide-border/70">
            {domains.map((domain) => (
              <DomainRow
                key={domain.id}
                domain={domain}
                locale={locale}
                disabled={addPending}
                onRemoved={(notice) => setListNotice(notice)}
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
