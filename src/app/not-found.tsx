import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { getTranslator } from "@/lib/i18n/locale";

/**
 * 404 global. Serve páginas inexistentes e lojas DESCONHECIDAS (o
 * /store/[slug] chama notFound() quando a loja não existe — loja inativa
 * NÃO vem parar aqui: ela tem o estado indisponível da vitrine, 200+noindex).
 * Segue o idioma do visitante (cookie `elicani_locale`).
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator();
  // 404 é página da PLATAFORMA (logo Elicani + voltar ao início): usa o
  // template normal "%s · Elicani". O que NUNCA aparece aqui é o default
  // de marketing do root (título da landing) — inexistente não é oferta.
  return { title: t("notFound.title") };
}

export default async function NotFound() {
  const t = await getTranslator();

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted/40 px-4 text-center">
      <Logo />

      <div className="space-y-2">
        <p className="text-4xl font-semibold tracking-tight">404</p>
        <h1 className="text-lg font-medium">{t("notFound.title")}</h1>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          {t("notFound.body")}
        </p>
      </div>

      <Button size="lg" asChild>
        <Link href="/">{t("common.backHome")}</Link>
      </Button>
    </div>
  );
}
