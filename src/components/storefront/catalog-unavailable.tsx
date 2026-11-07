import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { getTranslator } from "@/lib/i18n/locale";

/**
 * Estado do catálogo INATIVO — profissional, nunca 404 nem erro técnico.
 *
 * O RLS esconde a loja inativa do papel anon, por isso este estado NÃO
 * contém nenhum dado do comerciante (sem nome, sem logo da loja, sem
 * produtos): só a mensagem genérica no idioma do visitante (cookie
 * `elicani_locale`). A página /store/[slug] renderiza isto com status 200
 * e `robots noindex` — o proxy garante que loja INEXISTENTE continua a
 * receber 404 real por fora.
 */
export async function CatalogUnavailable() {
  const t = await getTranslator();

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted/40 px-4 text-center">
      <Logo />

      <div className="space-y-2">
        <h1 className="text-lg font-medium">{t("storefront.catalogUnavailable")}</h1>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          {t("storefront.catalogUnavailableHint")}
        </p>
      </div>

      <Button size="lg" asChild>
        <Link href="/">{t("common.backHome")}</Link>
      </Button>
    </div>
  );
}
