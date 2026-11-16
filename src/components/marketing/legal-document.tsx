/**
 * Documento legal da PLATAFORMA (Terms of Use / Privacy Policy) —
 * servidor puro, sem JS no cliente.
 *
 * Estrutura fixa: H1 (identidade "Elicani — {título}") + seções com
 * H2 e parágrafos. O conteúdo textual vive nas páginas (é conteúdo da
 * plataforma, em inglês, gerido por deploy — NÃO é editável no painel);
 * aqui está apenas o render para os dois documentos ficarem idênticos
 * em tipografia e semântica.
 */
export type LegalSection = {
  heading: string;
  paragraphs: string[];
};

export function LegalDocument({
  title,
  sections,
}: {
  title: string;
  sections: readonly LegalSection[];
}) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        {title}
      </h1>

      <div className="mt-8">
        {sections.map((section) => (
          <section key={section.heading} className="mt-8 first:mt-0">
            <h2 className="text-lg font-semibold tracking-tight">
              {section.heading}
            </h2>
            {section.paragraphs.map((paragraph) => (
              <p
                key={paragraph}
                className="mt-3 text-base leading-relaxed text-muted-foreground"
              >
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
