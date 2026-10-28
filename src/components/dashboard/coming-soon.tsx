import { Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getTranslator } from "@/lib/i18n/locale";
import type { MessageKey } from "@/lib/i18n/messages/en";

/**
 * Ecrã de secção ainda não implementada (Fase 1: quase tudo, exceto
 * Dashboard e Definições). Não inventa dados — apenas explica o estado.
 */
export async function ComingSoon({ sectionKey }: { sectionKey: MessageKey }) {
  const t = await getTranslator();
  const section = t(sectionKey);

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-start gap-3 py-10">
        <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Clock className="size-5" />
        </span>
        <CardTitle className="flex flex-wrap items-center gap-2 text-lg tracking-tight">
          {section}
          <Badge variant="outline" className="font-normal text-muted-foreground">
            {t("common.soon")}
          </Badge>
        </CardTitle>
        <CardDescription className="max-w-prose text-sm">
          {t("common.comingSoonBody", { section })}
        </CardDescription>
      </CardContent>
    </Card>
  );
}
