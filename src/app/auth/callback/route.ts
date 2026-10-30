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
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const next = resolveSafeNext(url.searchParams.get("next"), "/app");

  const loginUrl = new URL("/login", url);
  if (error || !code) {
    loginUrl.searchParams.set("error", "oauth");
    return NextResponse.redirect(loginUrl);
  }

  const supabase = await createClient();

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    loginUrl.searchParams.set("error", "oauth");
    return NextResponse.redirect(loginUrl);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    loginUrl.searchParams.set("error", "oauth");
    return NextResponse.redirect(loginUrl);
  }

  const store = await getStoreForOwner(user.id);
  if (!store) {
    return NextResponse.redirect(new URL("/app/onboarding", url));
  }

  return NextResponse.redirect(new URL(next, url));
}
