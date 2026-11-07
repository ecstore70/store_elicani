import { ImageIcon, Pencil, Palette } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Locale } from "@/lib/i18n/config";
import { createTranslator } from "@/lib/i18n/translate";
import { storePublicUrl } from "@/lib/stores/resolve";
import type { Store } from "@/lib/stores/types";

/**
 * Cartão de identidade do catálogo (nível loja da hierarquia
 * Elicani → loja → produto).
 *
 * Apresenta os assets que identificam a vitrine pública — logo, favicon e
 * capa — exatamente na cadeia de fallback que a metadata da loja usa
 * (`resolveStoreIconUrl`: favicon → logo → plataforma), mais o URL público
 * e os atalhos para os formulários EXISTENTES (definições e aparência).
 * Sem formulários novos: este cartão só lista e liga — a edição vive onde
 * já vive.
 *
 * Sem campos de marca na loja → pré-visualizações vazias com placeholder
 * (a metadata cai para a plataforma; nada é inventado aqui).
 */
export function CatalogIdentity({
  store,
  locale,
}: {
  store: Store;
  locale: Locale;
}) {
  const t = createTranslator(locale);

  // Cadeia de fallback do favicon, replicada para a pré-visualização
  // (o visitante vê exatamente o que o browser vai mostrar).
  const faviconUrl = store.favicon_url || store.logo_url || null;
  const publicUrl = storePublicUrl(store.slug);

  const tiles: Array<{
    key: "logo" | "favicon" | "cover";
    label: string;
    url: string | null;
    fit: "contain" | "cover";
  }> = [
    { key: "logo", label: t("settings.logo"), url: store.logo_url, fit: "contain" },
    { key: "favicon", label: t("catalog.assetFavicon"), url: faviconUrl, fit: "contain" },
    { key: "cover", label: t("catalog.assetCover"), url: store.banner_url, fit: "cover" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base tracking-tight">
          {t("catalog.identity")}
        </CardTitle>
        <CardDescription>{t("catalog.identityHelp")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {tiles.map((tile) => (
            <div key={tile.key} className="space-y-1.5">
              <div className="flex h-20 items-center justify-center overflow-hidden rounded-lg border bg-muted/40">
                {tile.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={tile.url}
                    alt={tile.label}
                    className={
                      tile.fit === "cover"
                        ? "size-full object-cover"
                        : "max-h-full max-w-full object-contain p-2"
                    }
                  />
                ) : (
                  <ImageIcon aria-hidden="true" className="size-5 text-muted-foreground/60" />
                )}
              </div>
              <p className="text-xs font-medium text-muted-foreground">
                {tile.label}
              </p>
            </div>
          ))}
        </div>

        <p className="text-sm text-muted-foreground">
          {t("dashboard.publicUrl")}:{" "}
          <Link
            href={publicUrl}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-xs underline-offset-4 hover:underline"
          >
            {publicUrl.replace(/^https?:\/\//, "")}
          </Link>
        </p>

        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline" size="sm">
            <Link href="/app/settings">
              <Pencil aria-hidden="true" className="size-3.5" />
              {t("catalog.editInformation")}
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/app/appearance">
              <Palette aria-hidden="true" className="size-3.5" />
              {t("catalog.editAppearance")}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
