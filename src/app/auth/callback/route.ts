import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { resolveSafeNext } from "@/lib/safe-redirect";
import { createClient } from "@/lib/supabase/server";
import { getStoreForOwner } from "@/lib/stores/queries";

/**
 * Callback do OAuth (Google).
 *
 * O Supabase redireciona de volta para aqui com `?code=` (PKCE) — na BASE
 * DE APLICAÇÃO (NEXT_PUBLIC_SITE_URL), nunca num domínio de loja. O código
 * é trocado por sessão e o usuário é roteado:
 *
 *  - sem store  → /app/onboarding (criação de store é uma por usuário;
 *                 o RLS + owner_id garantem isso — nada é criado aqui);
 *  - com store  → /app (ou o `next` interno original).
 *
 * Erros (link expirado, acesso negado no Google, sessão ausente) voltam
 * para /login com mensagem genérica — sem expor detalhes.
 *
 * TEMPORÁRIO (diagnóstico): cada branch grava telemetria em
 * public.auth_debug (service role) para identificar por que a troca do
 * código PKCE falha em produção. Remover após o diagnóstico.
 */
async function recordDebug(data: Record<string, unknown>): Promise<void> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) return;
    await fetch(`${url}/rest/v1/auth_debug`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ data }),
      cache: "no-store",
    });
  } catch {
    // melhor esforço: diagnóstico nunca derruba o callback
  }
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const next = resolveSafeNext(url.searchParams.get("next"), "/app");

  const cookieNames = request.cookies.getAll().map((c) => c.name);
  const verifierCookie = request.cookies
    .getAll()
    .find((c) => c.name.endsWith("-code-verifier"));
  const diag = {
    search: url.search.slice(0, 400),
    has_code: Boolean(code),
    error_param: error,
    sb_flow_id: url.searchParams.get("sb_flow_id"),
    all_cookies: cookieNames,
    verifier_cookie_name: verifierCookie?.name ?? null,
    verifier_sha256: verifierCookie
      ? createHash("sha256").update(verifierCookie.value.split("/")[0]).digest("hex")
      : null,
    ua: request.headers.get("user-agent")?.slice(0, 100) ?? null,
  };

  const loginUrl = new URL("/login", url);
  if (error || !code) {
    await recordDebug({ ...diag, branch: "a_no_code_or_error" });
    loginUrl.searchParams.set("error", "oauth");
    return NextResponse.redirect(loginUrl);
  }

  const supabase = await createClient();

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    await recordDebug({
      ...diag,
      branch: "b_exchange_error",
      exchange_error: exchangeError.message,
      exchange_status: (exchangeError as { status?: number }).status ?? null,
    });
    loginUrl.searchParams.set("error", "oauth");
    return NextResponse.redirect(loginUrl);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    await recordDebug({ ...diag, branch: "c_no_user_after_exchange" });
    loginUrl.searchParams.set("error", "oauth");
    return NextResponse.redirect(loginUrl);
  }

  const store = await getStoreForOwner(user.id);
  await recordDebug({
    ...diag,
    branch: "ok",
    user_id: user.id,
    has_store: Boolean(store),
  });
  if (!store) {
    return NextResponse.redirect(new URL("/app/onboarding", url));
  }

  return NextResponse.redirect(new URL(next, url));
}
