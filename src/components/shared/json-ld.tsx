/**
 * Bloco JSON-LD (Schema.org) — servidor puro, zero JS no cliente.
 *
 * Padrão oficial do Next.js (docs/01-app/02-guides/json-ld.md):
 * `JSON.stringify` + trocar `<` pela sequência de escape unicode
 * (barra-invertida + u003c) — neutraliza qualquer tentativa de
 * `</script>` embutida em conteúdo do comerciante (nome/descrição de
 * produto) sem invalidar o JSON.
 *
 * REGRA DE OURO desta arquitetura: só entra aqui informação REALMENTE
 * visível ou legitimamente disponível na página (preço, disponibilidade,
 * redes sociais já renderizadas, breadcrumb já desenhado). Nada é
 * inventado para "melhorar SEO" — markup falso é risco de penalidade,
 * não vantagem.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
