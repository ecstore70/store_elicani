"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { getTranslator } from "@/lib/i18n/locale";
import { createClient } from "@/lib/supabase/server";
import { requireStore } from "@/lib/stores/queries";
import { resolveTxt } from "./dns";
import {
  HOSTNAME_MESSAGE_KEYS,
  normalizeHostname,
} from "./hostname";
import { createRateGate } from "./rate-limit";
import {
  buildTxtName,
  evaluateVerification,
} from "./verify";
import {
  domainState,
  FAILURE_MESSAGE_KEYS,
  type DomainFormState,
} from "./types";

/**
 * Actions de domínio próprio (Fase 2 — verificação de posse por DNS TXT).
 *
 * Modelo de segurança: `requireUser()` (anon é redirecionado para /login
 * antes de tocar em dado algum) + `requireStore()` (loja ATIVA do cookie —
 * o cliente nunca envia store_id) + RLS `*_own` no banco. A consulta e a
 * atualização são sempre `.eq("store_id", store.id)`: não há como ler,
 * verificar ou apagar o domínio de outro lojista, e a resposta para
 * "não existe" é idêntica à de "não é seu" (sem vazamento).
 *
 * O token vem SEMPRE da linha lida com a sessão do dono — o cliente não
 * envia hostname nem token, portanto não é possível cruzar um hostname
 * com o registro de outra pessoa.
 */

/** Verificações DNS por usuário: 5 a cada 10 minutos (janela deslizante). */
const VERIFY_LIMIT = 5;
const VERIFY_WINDOW_MS = 10 * 60_000;
const verifyGate = createRateGate({
  limit: VERIFY_LIMIT,
  windowMs: VERIFY_WINDOW_MS,
});

/** Caminho revalidado: o card de domínios vive em /app/settings. */
const SETTINGS_PATH = "/app/settings";

/**
 * Reclama um domínio: normaliza (protocolo, caixa, plataforma…) e insere
 * com `status = 'pending'`. O `verification_token` é gerado pelo BANCO
 * (CSPRNG) — a aplicação nunca gera nem envia token.
 */
export async function addDomainAction(
  _prevState: DomainFormState,
  formData: FormData,
): Promise<DomainFormState> {
  const user = await requireUser();
  const t = await getTranslator();
  const store = await requireStore(user.id);

  const normalized = normalizeHostname(String(formData.get("hostname") ?? ""));
  if (!normalized.ok) {
    return domainState({
      fieldErrors: {
        hostname: t(HOSTNAME_MESSAGE_KEYS[normalized.problem]),
      },
    });
  }

  const supabase = await createClient();
  const { error } = await supabase.from("store_domains").insert({
    store_id: store.id,
    hostname: normalized.hostname,
  });

  if (error) {
    // 23505 = hostname já reclamado (por esta ou por outra loja). Mensagem
    // genérica e única: não revelar dono, loja, email nem status (§11).
    if (error.code === "23505") {
      return domainState({
        fieldErrors: { hostname: t("domains.error.unavailable") },
      });
    }
    // 23514 = CHECK do banco (defensivo: a normalização já validou).
    if (error.code === "23514") {
      return domainState({
        fieldErrors: { hostname: t("domains.error.invalid") },
      });
    }
    return domainState({ error: t("domains.error.addFailed") });
  }

  revalidatePath(SETTINGS_PATH);
  return domainState({ notice: t("domains.added") });
}

/**
 * Verifica a posse via DNS TXT server-side: monta `_elicaniverify.<host>`
 * a partir do hostname GRAVADO, consulta TXT com timeout limitado e
 * compara com o token GRAVADO (gerado pelo banco). Só o dono consegue
 * disparar (RLS + escopo de loja ativa); o lookup nunca sai do servidor.
 *
 * Sucesso → `status = 'active'` + `verified_at = now()` + `last_error = null`.
 * Falha   → permanece `pending` com o código do erro; DNS temporário
 *           NUNCA vira `failed` (§8) — é sempre retentável.
 */
export async function verifyDomainAction(
  domainId: string,
): Promise<DomainFormState> {
  const user = await requireUser();
  const t = await getTranslator();
  const store = await requireStore(user.id);

  if (!verifyGate.check(user.id)) {
    return domainState({ error: t("domains.error.rateLimited") });
  }

  const supabase = await createClient();
  const { data: domain, error: readError } = await supabase
    .from("store_domains")
    .select("id, hostname, status, verification_token")
    .eq("store_id", store.id)
    .eq("id", domainId)
    .maybeSingle();

  if (readError) {
    return domainState({ error: t("domains.error.verifyFailed") });
  }
  // Não existe, é de outra loja ou já foi removido — mesma resposta.
  if (!domain) {
    return domainState({ error: t("domains.error.notFound") });
  }

  const outcome = await evaluateVerification({
    lookup: resolveTxt,
    txtName: buildTxtName(domain.hostname),
    token: domain.verification_token,
  });

  if (outcome.ok) {
    const { error: updateError } = await supabase
      .from("store_domains")
      .update({
        status: "active",
        verified_at: new Date().toISOString(),
        last_error: null,
      })
      .eq("id", domain.id)
      .eq("store_id", store.id);
    if (updateError) {
      return domainState({ error: t("domains.error.verifyFailed") });
    }
    revalidatePath(SETTINGS_PATH);
    return domainState({ notice: t("domains.verified") });
  }

  // Falha: grava o CÓDIGO (nunca o erro cru do resolvedor) e mantém o
  // claim intacto. Domínio já verificado não é rebaixado por uma nova
  // checagem que falhou — só o `pending` registra `last_error`.
  if (domain.status === "pending") {
    await supabase
      .from("store_domains")
      .update({ last_error: outcome.failure })
      .eq("id", domain.id)
      .eq("store_id", store.id);
  }

  revalidatePath(SETTINGS_PATH);
  return domainState({ error: t(FAILURE_MESSAGE_KEYS[outcome.failure]) });
}

/**
 * Remove o claim. O token some com a linha. NÃO existe integração com
 * Vercel nesta fase: apagar aqui não apaga nada fora do banco — a
 * limpeza externa fica para a fase de integração.
 */
export async function removeDomainAction(
  domainId: string,
): Promise<DomainFormState> {
  const user = await requireUser();
  const t = await getTranslator();
  const store = await requireStore(user.id);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("store_domains")
    .delete()
    .eq("id", domainId)
    .eq("store_id", store.id)
    .select("id");

  if (error) {
    return domainState({ error: t("domains.error.removeFailed") });
  }
  if (!data || data.length === 0) {
    return domainState({ error: t("domains.error.notFound") });
  }

  revalidatePath(SETTINGS_PATH);
  return domainState({ notice: t("domains.removed") });
}
