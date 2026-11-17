import type { Metadata } from "next";
import { LegalDocument, type LegalSection } from "@/components/marketing/legal-document";
import { getLocale } from "@/lib/i18n/locale";
import { createTranslator } from "@/lib/i18n/translate";
import { PLATFORM_DESCRIPTION } from "@/lib/stores/metadata";

export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const t = createTranslator(await getLocale());
  const title = `Elicani — ${t("legal.privacy")}`;
  return {
    title: { absolute: title },
    description: PLATFORM_DESCRIPTION,
    alternates: { canonical: "/privacy" },
    openGraph: {
      title,
      description: PLATFORM_DESCRIPTION,
      url: "/privacy",
      type: "website",
    },
  };
}

/**
 * Política de Privacidade da PLATAFORMA — descreve APENAS o que o
 * código realmente faz com dados pessoais (conta por e-mail/Google,
 * dados da loja, dados de encomenda, cookie de sessão + cookie de
 * idioma `elicani_locale`, sem cookies publicitários e sem venda de
 * dados). Sem promessas legais inventadas: o texto de contacto é
 * placeholder explícito para o dono da plataforma completar.
 *
 * As políticas de cada loja são OUTRO documento (editável pelo
 * comerciante em /store/{slug}/privacy) — nunca misturar.
 */
const SECTIONS: readonly LegalSection[] = [
  {
    heading: "Who controls your data",
    paragraphs: [
      "Elicani operates this platform and is responsible for the personal data processed through it.",
      "Each merchant is separately responsible for the customer data they receive and manage in their own store. When you place an order in a store, that merchant receives your order details and becomes responsible for them.",
    ],
  },
  {
    heading: "Data we collect",
    paragraphs: [
      "Account data: your email address, your name (if provided) and authentication details, when you create an account.",
      "Store data: the information you enter for your store — name, contact details, descriptions, policies, product catalog, opening hours and appearance settings.",
      "Order data: when a customer places an order — name, phone, delivery address, order contents and any note added at checkout.",
      "Technical data: the session identifiers used to keep you signed in, and your language preference (stored in a cookie).",
      "Anonymous usage events: basic activity records of a store's storefront — such as catalog and product views, cart additions and checkout starts — tied to the store and containing no names, phone numbers or addresses.",
    ],
  },
  {
    heading: "How we use data",
    paragraphs: [
      "To provide and improve the platform; to display your store and catalog; to create and deliver orders to the merchant; to show orders in the merchant dashboard; to secure accounts; and to communicate about the service.",
    ],
  },
  {
    heading: "When data is shared",
    paragraphs: [
      "Order details are shared with the merchant of the store you order from, so the merchant can fulfil the order. Data is also processed by the infrastructure providers that host Elicani (storage and database), and disclosed when required by applicable law.",
      "Elicani does not sell personal data.",
    ],
  },
  {
    heading: "Orders and WhatsApp",
    paragraphs: [
      "Order information is stored so the merchant can see and manage it in their dashboard, and is passed to the merchant through WhatsApp as part of the order flow. Your conversation about the order continues on WhatsApp, under WhatsApp's own terms.",
    ],
  },
  {
    heading: "Retention",
    paragraphs: [
      "Account and store data is kept while the account exists. Merchants can remove products and store content at any time.",
      "You can request access to, correction of, or deletion of your personal data through the contact details published in this document.",
    ],
  },
  {
    heading: "Security",
    paragraphs: [
      "We use technical and organizational measures to protect personal data, including access controls and encrypted connections. No method of transmission is completely secure, and we cannot guarantee absolute security.",
    ],
  },
  {
    heading: "Cookies",
    paragraphs: [
      "Elicani uses essential cookies and storage to keep you signed in and to remember your language preference. We do not use advertising cookies.",
    ],
  },
  {
    heading: "Your rights",
    paragraphs: [
      "Depending on where you live, you may have rights to access, correct, delete, or restrict the use of your personal data. You can exercise those rights through the contact details published in this document.",
      "Merchants who receive your order data directly are also responsible for responding to requests about that data.",
    ],
  },
  {
    heading: "Children's data",
    paragraphs: [
      "Elicani is not directed at children and we do not knowingly collect personal data from children.",
    ],
  },
  {
    heading: "Changes to this policy",
    paragraphs: [
      "We may update this Privacy Policy from time to time. Changes take effect when published on this page.",
    ],
  },
  {
    heading: "Contact",
    paragraphs: [
      // PLACEHOLDER — nenhum canal de contacto da plataforma existe no
      // projeto; nada foi inventado. O dono publica aqui os dados reais.
      "Elicani's contact details will be published on this page.",
    ],
  },
];

export default async function PrivacyPage() {
  const t = createTranslator(await getLocale());
  return (
    <LegalDocument title={`Elicani — ${t("legal.privacy")}`} sections={SECTIONS} />
  );
}
