import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { getTranslator } from "@/lib/i18n/locale";

/**
 * 404 global. Serve tanto páginas inexistentes quanto lojas desconhecidas
 * (o /store/[slug] chama notFound() quando a loja não existe ou está inativa).
 * Segue o idioma do visitante (cookie `elicani_locale`).
 */
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
