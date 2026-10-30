import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Logo } from "@/components/shared/logo";
import { normalizeLocale } from "@/lib/i18n/config";
import { createTranslator } from "@/lib/i18n/translate";
import { getPublicStoreBySlug } from "@/lib/stores/queries";

type Props = { params: Promise<{ slug: string }> };

/** Resolve a loja no Supabase a cada requisição — rota dinâmica por natureza. */
export const instant = false;

/**
 * Vitrine pública — ROTEAMENTO PREPARADO, CONTEÚDO AINDA NÃO.
 *
 * O proxy encaminha {slug}.{NEXT_PUBLIC_STORE_DOMAIN}/ para aqui. Esta página
 * resolve a loja com a credencial ANON (o RLS só devolve lojas ativas) e
 * mostra um placeholder honesto: carrinho, checkout e WhatsApp ficam para
 * as fases seguintes.
 *
 * A vitrine fala o idioma DEFINIDO PELA LOJA — independente do país e da
 * moeda escolhidos.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const store = await getPublicStoreBySlug(slug);

  if (!store) {
    return { title: "Store not found" };
  }

  return {
    title: store.name,
    description: store.description ?? `${store.name} on Elicani`,
  };
}

export default async function StorefrontPage({ params }: Props) {
  const { slug } = await params;
  const store = await getPublicStoreBySlug(slug);

  if (!store) {
    notFound();
  }

  const t = createTranslator(normalizeLocale(store.language));

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="border-b border-border/70">
        <div className="mx-auto flex h-16 w-full max-w-4xl items-center justify-between gap-4 px-4 sm:px-6">
          <span className="truncate text-base font-semibold tracking-tight">
            {store.name}
          </span>
          <span className="shrink-0 font-mono text-xs text-muted-foreground">
            {store.slug}
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-14 sm:px-6 sm:py-20">
        <div className="max-w-xl space-y-6">
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {store.name}
            </h1>
            {store.description && (
              <p className="text-base leading-relaxed text-muted-foreground">
                {store.description}
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-dashed border-border/70 bg-card p-6">
            <p className="text-sm font-medium">{t("storefront.comingSoon")}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {t("storefront.comingSoonBody")}
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-border/70">
        <div className="mx-auto flex h-14 w-full max-w-4xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo variant="mono" className="h-5 text-muted-foreground" />
          <span className="font-mono text-xs text-muted-foreground">
            {store.currency}
          </span>
        </div>
      </footer>
    </div>
  );
}
