"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";
import { createTranslator } from "@/lib/i18n/translate";

/**
 * Limite de erro da área /app.
 * Assinatura do Next 16: `{ error, retry }` (antes era `reset`).
 *
 * Um error boundary é Client Component e não lê cookies, então usa o
 * idioma padrão — o restante da UI continua localizada.
 */
export default function AppError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  const t = createTranslator(DEFAULT_LOCALE);

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
            <AlertTriangle aria-hidden="true" className="size-4" />
          </span>
          <CardTitle className="text-lg tracking-tight">
            {t("error.title")}
          </CardTitle>
          <CardDescription>{t("error.body")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" onClick={() => retry()} className="w-full">
            {t("error.retry")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
