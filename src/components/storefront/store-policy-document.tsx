import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * Corpo de uma página de documento da LOJA (terms / privacy / faq)
 * dentro do `StoreShell` — servidor puro, zero JS no cliente.
 *
 * H1 = identidade da PRÓPRIA loja ("{Nome} — {título localizado}") —
 * nunca "Elicani" no título do comerciante (regra de identidade da
 * plataforma vs. loja). Link "voltar" reutiliza a string existente da
 * vitrine (`strings.backToStore`), mesmo padrão da página de produto.
 *
 * `headingClass` vem do template da loja (`TEMPLATE_CLASSES`) para o
 * título seguir a tipografia escolhida pelo comerciante.
 */
export function StorePolicyDocument({
  title,
  headingClass,
  backLabel,
  storeSlug,
  children,
}: {
  title: string;
  headingClass: string;
  backLabel: string;
  storeSlug: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-[var(--sf-container)] px-4 py-8 sm:px-6">
      <nav className="mb-5">
        <Link
          href={`/store/${storeSlug}`}
          className="inline-flex items-center gap-1.5 text-sm text-[var(--sf-muted)] underline-offset-4 transition-colors hover:text-[var(--sf-fg)] hover:underline"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          {backLabel}
        </Link>
      </nav>

      <article className="max-w-3xl">
        <h1 className={`text-xl leading-tight sm:text-2xl ${headingClass}`}>
          {title}
        </h1>
        <div className="mt-6">{children}</div>
      </article>
    </div>
  );
}
