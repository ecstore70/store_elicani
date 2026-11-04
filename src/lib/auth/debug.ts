// TEMPORÁRIO — telemetria do fluxo OAuth/PKCE para diagnóstico em produção.
// Remove depois que a causa da falha do login Google for confirmada.
import { createHash } from "node:crypto";

/**
 * Digesto sha256 (base64url) de cada cookie de verifier PKCE — MESMO formato
 * que o GoTrue compara com o `code_challenge` (s256). Não expõe o verifier.
 */
export function verifierDigests(
  cookies: ReadonlyArray<{ name: string; value: string }>,
): Array<{ name: string; b64: string; len: number }> {
  return cookies
    .filter((c) => c.name.endsWith("-code-verifier"))
    .map((c) => {
      const verifier = c.value.split("/")[0];
      return {
        name: c.name,
        b64: createHash("sha256").update(verifier).digest("base64url"),
        len: verifier.length,
      };
    });
}

/** Grava uma linha em public.auth_debug (service role). Melhor esforço. */
export async function recordDebug(data: Record<string, unknown>): Promise<void> {
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
    // diagnóstico nunca derruba o fluxo de auth
  }
}
