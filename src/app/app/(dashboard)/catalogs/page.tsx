import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getLocale } from "@/lib/i18n/locale";
import { createTranslator } from "@/lib/i18n/translate";
import { setActiveStoreAction } from "@/lib/stores/actions";
import { getStoresForOwner, resolveActiveStore } from "@/lib/stores/queries";

export async function generateMetadata(): Promise<Metadata> {
  const t = createTranslator(await getLocale());
  return { title: t("catalogs.title") };
}

/**
 * My Catalogs — a lista de lojas da conta (multi-catalog).
 *
 * Sempre a partir da lista do PRÓPRIO dono (RLS no banco): o catálogo
 * atual vem do cookie validado (`resolveActiveStore`) e é o único com
 * badge "Current". Trocar é uma server action que revalida o layout
 * inteiro do painel — produtos, encomendas, definições e políticas
 * passam a servir a loja escolhida.
 *
 * Zero lojas nunca chega aqui: o layout do dashboard já redireciona para
 * o onboarding (guarda redundante abaixo para chamada direta).
 */
export default async function CatalogsPage() {
  const user = await requireUser();
  const stores = await getStoresForOwner(user.id);
  if (stores.length === 0) {
    redirect("/app/onboarding");
  }

  const active = await resolveActiveStore(user.id);

  const locale = await getLocale();
  const t = createTranslator(locale);

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("catalogs.title")}
        description={t("catalogs.subtitle")}
        action={
          <Button asChild>
            <Link href="/app/catalogs/new">
              <Plus aria-hidden="true" className="size-4" />
              {t("catalogs.create")}
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4">
        {stores.map((store) => {
          const isCurrent = store.id === active?.id;

          return (
            <Card
              key={store.id}
              className={isCurrent ? "border-primary/60" : undefined}
            >
              <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-medium">{store.name}</p>
                    {isCurrent && (
                      <Badge>{t("catalogs.current")}</Badge>
                    )}
                  </div>
                  <p className="truncate font-mono text-xs text-muted-foreground">
                    {store.slug}
                  </p>
                </div>

                {!isCurrent && (
                  <form action={setActiveStoreAction.bind(null, store.id)}>
                    <Button
                      type="submit"
                      variant="outline"
                      size="sm"
                      aria-label={t("catalogs.switchTo", { name: store.name })}
                    >
                      {t("catalogs.switch")}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
