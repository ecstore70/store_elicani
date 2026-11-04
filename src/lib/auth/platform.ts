import type { User } from "@supabase/supabase-js";

/**
 * Dono da plataforma (Elicani) — mecanismo de autorização de exceções.
 *
 * Identificação: claim `platform_owner` em **app_metadata** do Supabase Auth.
 *
 * Por que app_metadata e não outra coisa:
 *  - só o servidor grava (Admin API / service_role) — o cliente NÃO consegue
 *    auto-elevar-se (user_metadata seria gravável pelo próprio usuário);
 *  - não depende de username, e-mail, nome de loja, slug ou flag de UI;
 *  - aqui a claim é lida SEMPRE do user devolvido por `auth.getUser()`,
 *    que valida o token junto ao Supabase Auth — nunca de dados enviados
 *    pelo formulário.
 *
 * Aplicações hoje: exceção de slug reservado "shop" na criação de loja
 * (ver `PLATFORM_OWNER_RESERVED_SLUGS` em src/lib/stores/slug.ts).
 */
export function isPlatformOwner(
  user: Pick<User, "app_metadata"> | null | undefined,
): boolean {
  const meta: unknown = user?.app_metadata;
  if (!meta || typeof meta !== "object") return false;
  return (meta as { platform_owner?: unknown }).platform_owner === true;
}
