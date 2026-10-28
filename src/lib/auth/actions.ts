"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSiteUrl } from "@/lib/env";
import { getTranslator } from "@/lib/i18n/locale";
import type { MessageKey } from "@/lib/i18n/messages/en";
import type { Translator } from "@/lib/i18n/translate";
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

/** Redireciona apenas para caminhos internos (bloqueia open redirect). */
function safeNext(value: FormDataEntryValue | null): string {
  if (typeof value !== "string") return "/app";
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("://")) {
    return "/app";
  }
  return value;
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

export async function signupAction(
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
  if (password.length < 8) {
    return { error: t("auth.error.weakPassword"), notice: null };
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
