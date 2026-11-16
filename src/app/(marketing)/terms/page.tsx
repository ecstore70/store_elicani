import type { Metadata } from "next";
import { LegalDocument, type LegalSection } from "@/components/marketing/legal-document";
import { getLocale } from "@/lib/i18n/locale";
import { createTranslator } from "@/lib/i18n/translate";
import { PLATFORM_DESCRIPTION } from "@/lib/stores/metadata";

export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const t = createTranslator(await getLocale());
  const title = `Elicani — ${t("legal.terms")}`;
  return {
    title: { absolute: title },
    description: PLATFORM_DESCRIPTION,
    alternates: { canonical: "/terms" },
    openGraph: {
      title,
      description: PLATFORM_DESCRIPTION,
      url: "/terms",
      type: "website",
    },
  };
}

/**
 * Termos de Uso da PLATAFORMA (host canônico elicani.site — o proxy
 * redireciona /terms vindo de subdomínios de loja para cá).
 *
 * Conteúdo inicial profissional e NEUTRO: descreve apenas o que a
 * plataforma realmente faz (catálogo, pedidos via WhatsApp, sem
 * processamento de pagamentos). Não inventa dados societários,
 * juridição ou canais de contacto — o texto de contacto é um
 * placeholder explícito que o dono da plataforma deve completar
 * (sinalizado no relatório final).
 *
 * NÃO confundir com as políticas de cada loja: as do comerciante são
 * conteúdo editável no painel (`stores.terms`/`stores.privacy_policy`)
 * e vivem em /store/{slug}/terms|privacy.
 */
const SECTIONS: readonly LegalSection[] = [
  {
    heading: "Acceptance of these terms",
    paragraphs: [
      "By accessing or using Elicani — the platform, this website and the merchant dashboard — you agree to be bound by these Terms of Use. If you do not agree, please do not use the service.",
    ],
  },
  {
    heading: "What Elicani is",
    paragraphs: [
      "Elicani is a technology platform that allows merchants to create an online storefront, publish a product catalog and store information, and receive orders from customers through WhatsApp.",
      "Elicani provides the software. Each store is operated by its own merchant, who is responsible for their content, prices, stock, delivery and customer service.",
    ],
  },
  {
    heading: "Accounts",
    paragraphs: [
      "You need an account to create and manage a store. You can sign up with your email address or with Google.",
      "Each account can operate one store. You are responsible for keeping your login credentials confidential and for any activity performed through your account.",
    ],
  },
  {
    heading: "Your store and your content",
    paragraphs: [
      "You retain ownership of the content you publish in your store — product descriptions, images, prices, opening hours, policies and frequently asked questions.",
      "You grant Elicani the technical permission to host and display that content as needed to operate your storefront.",
      "You confirm that you have the necessary rights to publish your content and that it does not infringe the rights of others or applicable law.",
    ],
  },
  {
    heading: "Customer relationships and orders",
    paragraphs: [
      "Customers browse catalogs and place orders directly with the merchant. Orders are delivered to the merchant (through the store's WhatsApp) and managed in the merchant's dashboard.",
      "The sale agreement is concluded between the customer and the merchant. Elicani is not a party to that agreement and does not set prices, stock, delivery times or return conditions.",
    ],
  },
  {
    heading: "Payments",
    paragraphs: [
      "Elicani does not process payments. Any payment method, price and financial arrangement is agreed directly between the customer and the merchant.",
    ],
  },
  {
    heading: "Acceptable use",
    paragraphs: [
      "You agree not to: use the platform for unlawful purposes; publish content that infringes intellectual property or the rights of third parties; mislead customers about who you are (including impersonating Elicani); attempt to disrupt, probe or overload the service; or extract content from the platform at scale without permission.",
    ],
  },
  {
    heading: "Intellectual property",
    paragraphs: [
      "The Elicani name, logo, interface, software and design belong to the platform and its licensors. These Terms do not transfer any ownership of that intellectual property — only the limited right to use the service while you comply with these Terms.",
    ],
  },
  {
    heading: "Stores that violate these Terms",
    paragraphs: [
      "Elicani may disable a store or remove content that violates these Terms, infringes third-party rights, or creates a risk to the platform or its users.",
    ],
  },
  {
    heading: "Service availability",
    paragraphs: [
      "The service is provided as available. We work to keep Elicani reliable, but we do not guarantee uninterrupted or error-free availability, and we may modify or discontinue features over time.",
    ],
  },
  {
    heading: "Limitation of liability",
    paragraphs: [
      "To the maximum extent permitted by law, Elicani is not liable for indirect, incidental or consequential damages arising from the use of the platform or from transactions between customers and merchants.",
    ],
  },
  {
    heading: "Changes to these Terms",
    paragraphs: [
      "We may update these Terms from time to time. Changes take effect when published on this page; continued use of the platform after changes means you accept them.",
    ],
  },
  {
    heading: "Contact",
    paragraphs: [
      // PLACEHOLDER — o projeto não tem nenhum canal de contacto da
      // plataforma (nenhum e-mail/endereço existe no código). Nada foi
      // inventado: o dono deve publicar aqui os dados reais de suporte.
      "Elicani's contact details will be published on this page.",
    ],
  },
];

export default async function TermsPage() {
  const t = createTranslator(await getLocale());
  return <LegalDocument title={`Elicani — ${t("legal.terms")}`} sections={SECTIONS} />;
}
