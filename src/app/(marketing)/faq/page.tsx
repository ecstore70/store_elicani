import type { Metadata } from "next";
import { JsonLd } from "@/components/shared/json-ld";
import { buildFaqJsonLd } from "@/lib/faq-jsonld";
import { getLocale } from "@/lib/i18n/locale";
import { createTranslator } from "@/lib/i18n/translate";
import { PLATFORM_DESCRIPTION } from "@/lib/stores/metadata";

export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const t = createTranslator(await getLocale());
  const title = `Elicani — ${t("legal.faqFull")}`;
  return {
    title: { absolute: title },
    description: PLATFORM_DESCRIPTION,
    alternates: { canonical: "/faq" },
    openGraph: {
      title,
      description: PLATFORM_DESCRIPTION,
      url: "/faq",
      type: "website",
    },
  };
}

/**
 * FAQ da PLATAFORMA — 11 perguntas com respostas baseadas APENAS em
 * funcionalidade real do produto (catálogo, pedidos via WhatsApp, sem
 * processamento de pagamentos, sem canal de contacto inventado).
 *
 * O MESMO array alimenta o render visível e o FAQPage JSON-LD
 * (regra de ouro: markup só espelha conteúdo visível). A pergunta de
 * contacto traz placeholder honesto — o dono da plataforma deve
 * publicar o canal real (sinalizado no relatório final).
 *
 * I18n: os rótulos/título da página usam o sistema existente; o corpo
 * das perguntas é conteúdo da plataforma (inglês, gerido por deploy).
 */
const FAQ: readonly { question: string; answer: string }[] = [
  {
    question: "What is Elicani?",
    answer:
      "Elicani is a platform for creating online storefronts. Merchants publish their catalog — products, prices, images and store information — and customers browse it and place orders, which are delivered to the merchant through WhatsApp.",
  },
  {
    question: "What is a catalog or store?",
    answer:
      "A catalog is a merchant's public storefront: their products, categories, images, opening hours and policies. Each store has its own address on the platform and is shared with customers through a simple link.",
  },
  {
    question: "How does a merchant create a store?",
    answer:
      "The merchant signs up with an email address (or Google), fills in the store name, WhatsApp number and other details, and the store is created immediately. From the dashboard they add products, images and categories and customize the appearance.",
  },
  {
    question: "How do customers use a catalog?",
    answer:
      "Customers open the store link, search or browse products, add items to a cart and send the order. Browsing and ordering do not require creating an account.",
  },
  {
    question: "How are orders handled?",
    answer:
      "The order is summarized in a WhatsApp message sent to the store's WhatsApp number. The merchant then sees and manages the order in their dashboard, and keeps the customer conversation going on WhatsApp.",
  },
  {
    question: "Does Elicani process payments?",
    answer:
      "No. Elicani does not handle payments. Prices, payment methods and any financial arrangement are agreed directly between the customer and the merchant.",
  },
  {
    question: "What is WhatsApp's role in the order flow?",
    answer:
      "WhatsApp is the channel where the order arrives at the merchant and where the customer and merchant continue the conversation. Elicani prepares the order message; the conversation itself happens on WhatsApp.",
  },
  {
    question: "Can merchants customize their storefront?",
    answer:
      "Yes. Merchants choose the template, colors, button styles, logo, favicon, cover image, opening hours and social links from their dashboard.",
  },
  {
    question: "How do merchants manage products?",
    answer:
      "In the dashboard: add, edit and organize products with images, prices, categories and availability, and mark featured items. Each product page can also be enriched with custom content blocks.",
  },
  {
    question: "How do merchants define their store policies?",
    answer:
      "From Settings → Policies & FAQ, the merchant publishes their own terms of use, privacy policy and the questions customers ask most often. These pages are part of the merchant's own store.",
  },
  {
    question: "How can a merchant contact Elicani?",
    answer:
      // PLACEHOLDER — nenhum canal de contacto da plataforma existe no
      // projeto; nada foi inventado. O dono publica aqui o canal real.
      "Elicani's official contact details will be published on this page.",
  },
];

export default async function FaqPage() {
  const t = createTranslator(await getLocale());
  // O JSON-LD nasce do MESMO array renderizado abaixo — nunca de itens
  // extras (só existe conteúdo visível, logo o markup existe sempre).
  const jsonLd = buildFaqJsonLd(FAQ);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        {`Elicani — ${t("legal.faqFull")}`}
      </h1>

      <div className="mt-8">
        {FAQ.map((item) => (
          <section key={item.question} className="mt-8 first:mt-0">
            <h2 className="text-lg font-semibold tracking-tight">
              {item.question}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">
              {item.answer}
            </p>
          </section>
        ))}
      </div>

      {jsonLd ? <JsonLd data={jsonLd} /> : null}
    </div>
  );
}
