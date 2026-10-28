import { PageHeader } from "@/components/dashboard/page-header";
import { ComingSoon } from "@/components/dashboard/coming-soon";
import { getTranslator } from "@/lib/i18n/locale";
import type { MessageKey } from "@/lib/i18n/messages/en";

/**
 * Ecrã de secção ainda não implementada na Fase 1.
 * Cada página de placeholder tem 4 linhas e nenhum dado inventado.
 */
export async function PlaceholderPage({ titleKey }: { titleKey: MessageKey }) {
  const t = await getTranslator();

  return (
    <div className="space-y-6">
      <PageHeader title={t(titleKey)} />
      <ComingSoon sectionKey={titleKey} />
    </div>
  );
}
