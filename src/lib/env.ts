/**
 * Acesso centralizado às variáveis de ambiente.
 *
 * Falha rápido com uma mensagem clara em vez de quebrar em runtime com
 * "undefined". Nunca imprime valores — apenas o nome da variável.
 */

export function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing environment variable: ${name}. ` +
        `Copy .env.example to .env.local and fill in the values.`,
    );
  }
  return value;
}

export function getSupabaseUrl(): string {
  return requireEnv("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export function getSupabaseAnonKey(): string {
  return requireEnv(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? `${getSiteUrl()}/app`;
}
