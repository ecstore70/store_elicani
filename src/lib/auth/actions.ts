"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSiteUrl } from "@/lib/env";
import { getTranslator } from "@/lib/i18n/locale";
import type { MessageKey } from "@/lib/i18n/messages/en";
import type { Translator } from "@/lib/i18n/translate";
import { resolveSafeNext } from "@/lib/safe-redirect";
import { createClient } from "@/lib/supabase/server";
import type { AuthState } from "./types";

/** Chave i18n por código de erro do Supabase Auth. */
const AUTH_ERROR_KEYS: Record<string, MessageKey> = {
  invalid_credentials: "auth.error.invalidCredentials",
  email_not_confirmed: "auth.error.emailNotConfirmed",
  user_already_exists: "auth.error.userAlreadyExists",
  weak_password: "auth.error.weakPassword",
  over_email_send_rate_limit: "auth.error.rateLimited",
  rate_limit_exceeded: "auth.error.rateLimited",
  email_address_invalid: "auth.error.invalidEmail",
  validation_failed: "auth.error.invalidEmail",
  signup_disabled: "auth.error.signupFailed",
};

type AuthApiError = { code?: string; message?: string };

/**
 * Converte erros do Supabase Auth em mensagens de usuário.
 * Nunca expõe detalhes internos (schema, banco, SQL).
 */
function mapAuthError(
  error: AuthApiError,
  t: Translator,
  fallbackKey: MessageKey,
): string {
  const code = error.code ?? "";
  const byCode = code ? AUTH_ERROR_KEYS[code] : undefined;
  if (byCode) return t(byCode);

  const message = (error.message ?? "").toLowerCase();
  if (message.includes("already registered")) return t("auth.error.userAlreadyExists");
  if (message.includes("invalid login credentials")) return t("auth.error.invalidCredentials");
  if (message.includes("email not confirmed")) return t("auth.error.emailNotConfirmed");
  if (message.includes("rate limit")) return t("auth.error.rateLimited");
  if (message.includes("password")) return t("auth.error.weakPassword");

  return t(fallbackKey);
}

function isEmailLike(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

/** Redireciona apenas para caminhos internos (guarda compartilhada). */
function safeNext(value: FormDataEntryValue | null): string {
  return resolveSafeNext(typeof value === "string" ? value : null);
}

export async function loginAction(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const t = await getTranslator();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: t("auth.error.required"), notice: null };
  }
  if (!isEmailLike(email)) {
    return { error: t("auth.error.invalidEmail"), notice: null };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: mapAuthError(error, t, "auth.error.loginFailed"), notice: null };
  }

  if (!data.session) {
    return { error: t("auth.error.loginFailed"), notice: null };
  }

  revalidatePath("/", "layout");
  redirect(safeNext(formData.get("next")));
}

/**
 * Login via Google OAuth.
 *
 * Usa o provider já configurado no projeto Supabase (nada de configuração
 * nova). O `redirectTo` volta para /auth/callback NA BASE DE APLICAÇÃO
 * (NEXT_PUBLIC_SITE_URL) — nunca para um domínio de loja. O callback
 * conclui a sessão e roteia: com store → /app; sem store → onboarding.
 */
export async function loginWithGoogleAction(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const t = await getTranslator();
  const supabase = await createClient();
  const next = safeNext(formData.get("next"));

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    return { error: t("auth.error.oauth"), notice: null };
  }

  redirect(data.url);
}

export async function signupAction(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const t = await getTranslator();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!email || !password || !confirm) {
    return { error: t("auth.error.required"), notice: null };
  }
  if (!isEmailLike(email)) {
    return { error: t("auth.error.invalidEmail"), notice: null };
  }
  if (password.length < 8) {
    return { error: t("auth.error.weakPassword"), notice: null };
  }
  // A confirmação é validação EXCLUSIVA da aplicação — nunca chega ao
  // Supabase (só email + password vão para signUp).
  if (password !== confirm) {
    return { error: t("auth.error.passwordsMismatch"), notice: null };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${getSiteUrl()}/login`,
    },
  });

  if (error) {
    return { error: mapAuthError(error, t, "auth.error.signupFailed"), notice: null };
  }

  // Confirmação de email ativa: sem sessão ainda — o usuário precisa
  // confirmar o email e depois entrar.
  if (!data.session) {
    return {
      error: null,
      notice: t("auth.checkEmail", { email }),
    };
  }

  // Sem confirmação de email: sessão ativa, segue direto para /app
  // (sem store, o layout redireciona para o onboarding).
  revalidatePath("/", "layout");
  redirect(safeNext(formData.get("next")));
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();

  revalidatePath("/", "layout");
  redirect("/login");
}

/**
 * Recuperação de senha: envia o link de redefinição para o e-mail.
 *
 * O link do Supabase redireciona de volta para `/reset-password` NA BASE DA
 * APLICAÇÃO (`NEXT_PUBLIC_SITE_URL` = app.elicani.site em produção) — nunca
 * para um domínio de loja. A URL precisa estar na allowlist de Redirect URLs
 * do Supabase.
 *
 * Resposta é sempre genérica (sem enumerar contas existentes).
 */
export async function forgotPasswordAction(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const t = await getTranslator();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email) {
    return { error: t("auth.error.emailRequired"), notice: null };
  }
  if (!isEmailLike(email)) {
    return { error: t("auth.error.invalidEmail"), notice: null };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getSiteUrl()}/reset-password`,
  });

  if (error) {
    return {
      error: mapAuthError(error, t, "auth.error.passwordResetFailed"),
      notice: null,
    };
  }

  return { error: null, notice: t("auth.forgot.checkEmail") };
}

/**
 * Redefinição de senha: troca o `?code=` do link por sessão (PKCE) e
 * grava a nova senha. Só funciona com uma sessão de recuperação válida —
 * não é um endpoint de troca de senha de qualquer usuário autenticado.
 */
export async function resetPasswordAction(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const t = await getTranslator();
  const code = String(formData.get("code") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!password || !confirm) {
    return { error: t("auth.error.required"), notice: null };
  }
  if (password.length < 8) {
    return { error: t("auth.error.weakPassword"), notice: null };
  }
  if (password !== confirm) {
    return { error: t("auth.error.passwordsMismatch"), notice: null };
  }

  const supabase = await createClient();

  // O link de recuperação traz ?code=... (flow PKCE). A sessão de
  // recuperação é de uso único; se já trocada, aproveita a sessão atual.
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    if (!code) {
      return { error: t("auth.reset.invalidLink"), notice: null };
    }
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) {
      return { error: t("auth.reset.invalidLink"), notice: null };
    }
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return {
      error: mapAuthError(error, t, "auth.error.updatePasswordFailed"),
      notice: null,
    };
  }

  // Sucesso: encerra a sessão de recuperação e leva o usuário ao LOGIN
  // com a mensagem de sucesso — ele entra com a nova senha.
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login?reset=1");
}
