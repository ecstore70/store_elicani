import type { Metadata } from "next";
import { getLocale } from "@/lib/i18n/locale";
import { createTranslator } from "@/lib/i18n/translate";
import { listActivePublicStores } from "@/lib/stores/queries";
import { storePublicUrl } from "@/lib/stores/resolve";

export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const t = createTranslator(await getLocale());
  const title = `Elicani — ${t("stores.title")}`;
  const description = t("stores.intro");
  return {
    // `absolute`: nas páginas da PLATAFORMA o título é completo (mesmo
    // padrão de /faq) — nunca herda template de outro segmento.
    title: { absolute: title },
    description,
    alternates: { canonical: "/stores" },
    openGraph: {
      title,
      description,
      url: "/stores",
      type: "website",
    },
  };
}

/**
 * Diretório público de lojas — a ponte CRAWLÁVEL
 * `elicani.site → /stores → loja do comerciante` (o sitemap não é mais a
 * única relação entre a plataforma e as vitrines).
 *
 *  • server component puro: sem JavaScript, links reais `<a href>` no
 *    URL canônico de cada loja (`storePublicUrl` — mesma fonte do
 *    sitemap/canônica);
 *  • MULTITENANT por construção: a lista nasce do banco a cada
 *    requisição (RLS público = só lojas ATIVAS + filtro redundante) —
 *    loja nova aparece sozinha; inativada/desativada desaparece daqui e
 *    do sitemap sem mudança de código. Nenhum lojista, loja, slug ou
 *    dado é fixo aqui;
 *  • só o MÍNIMO de cartão (nome, descrição, logo) — sem contadores
 *    inventados, sem JSON-LD falso, sem links para o painel/admin;
 *  • o idioma do título/intro vem do sistema i18n existente (cookie
 *    `elicani_locale` → padrão).
 */
export default async function StoresPage() {
  const t = createTranslator(await getLocale());
  const stores = await listActivePublicStores();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        {`Elicani — ${t("stores.title")}`}
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
        {t("stores.intro")}
      </p>

      {stores.length === 0 ? (
        <p className="mt-8 text-base leading-relaxed text-muted-foreground">
          {t("stores.empty")}
        </p>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stores.map((store) => (
            <li key={store.id}>
              <a
                href={storePublicUrl(store.slug)}
                className="group flex h-full flex-col gap-3 rounded-xl border border-border/70 bg-background p-5 transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
              >
                {store.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={store.logo_url}
                    alt=""
                    className="h-10 w-10 rounded-lg object-cover"
                  />
                ) : null}
                <span className="font-semibold">{store.name}</span>
                {store.description ? (
                  <span className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                    {store.description}
                  </span>
                ) : null}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
