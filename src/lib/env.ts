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

/**
 * Base da APLICAÇÃO do lojista: autenticação e painel.
 *
 *   produção: https://app.elicani.site
 *   desenvolvimento: http://localhost:3000
 *
 * Todos os redirects do Supabase Auth (confirmação de e-mail, recuperação
 * de senha) derivam desta base — nunca de um domínio de loja
 * (`*.elicani.site`), que é exclusivamente vitrine pública.
 */
export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

/**
 * Domínio do site de MARKETING.
 *
 *   produção: https://elicani.site
 *   desenvolvimento: http://localhost:3000
 *
 * Usado apenas para resolver URLs absolutas de metadados (OpenGraph).
 * Nunca participa de redirects de autenticação.
 */
export function getMarketingUrl(): string {
  return process.env.NEXT_PUBLIC_MARKETING_URL ?? getSiteUrl();
}
