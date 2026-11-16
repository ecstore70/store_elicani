/**
 * FAQPage JSON-LD (Schema.org) — construído APENAS a partir do conteúdo
 * de FAQ visível na página (mesma fonte de dados do render). Nunca inventa
 * perguntas: itens ausentes da lista ficam ausentes do markup — a regra de
 * ouro é que JSON-LD espelhe exatamente o que o usuário lê.
 *
 * Devolve `null` quando não há perguntas (nada de bloco vazio/inválido).
 * O render usa o mesmo array — a correspondência é estrutural.
 */
export type FaqJsonLdItem = {
  question: string;
  answer: string;
};

export function buildFaqJsonLd(
  items: readonly FaqJsonLdItem[],
): Record<string, unknown> | null {
  if (items.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
