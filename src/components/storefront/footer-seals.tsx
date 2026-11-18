import { StoreSeal } from "./store-seal";
import type { StoreTemplate } from "@/lib/stores/appearance";
import type { StorefrontStrings } from "@/lib/storefront/strings";

/**
 * Três selos de capacidade do rodapé — o "acabamento" da hierarquia
 * (identidade da loja → selos → links → moeda → Powered by Elicani).
 *
 * Textos reais da plataforma (nunca certificações inventadas):
 * catálogo online, pedidos via WhatsApp, contacto direto. A única
 * variação de contexto é o template RESTAURANTE do próprio comerciante
 * (dado já existente — nenhum sistema de categoria novo): "cardápio
 * online" no lugar de "catálogo online". Informativos e não clicáveis.
 */
export function FooterSeals({
  strings,
  template,
}: {
  strings: StorefrontStrings;
  template: StoreTemplate;
}) {
  const texts = [
    template === "restaurant" ? strings.sealMenu : strings.sealCatalog,
    strings.sealOrders,
    strings.sealSupport,
  ];

  return (
    <ul className="flex flex-wrap items-center justify-center gap-3 sm:gap-6">
      {texts.map((text) => (
        <li key={text}>
          {/* compacto no mobile (3 cabem em 320px sem apertar), um pouco
              maior no desktop — nunca dominam o rodapé */}
          <StoreSeal text={text} className="size-[5.25rem] sm:size-24" />
        </li>
      ))}
    </ul>
  );
}
