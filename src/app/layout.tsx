import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getMarketingUrl } from "@/lib/env";
import { getLocaleDirection } from "@/lib/i18n/config";
import { getLocale } from "@/lib/i18n/locale";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // Metadados absolutos (OG) apontam para o site de marketing — nunca
  // para o domínio de autenticação nem para lojas individuais.
  metadataBase: new URL(getMarketingUrl()),
  title: {
    default: "Elicani — Sell online, take orders on WhatsApp",
    template: "%s · Elicani",
  },
  description:
    "Elicani gives your business its own storefront. Products, customers and orders in one place — in any currency.",
  applicationName: "Elicani",
  openGraph: {
    type: "website",
    siteName: "Elicani",
    title: "Elicani — Sell online, take orders on WhatsApp",
    description:
      "Elicani gives your business its own storefront. Products, customers and orders in one place — in any currency.",
    images: [{ url: "/brand/elicani-og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Elicani — Sell online, take orders on WhatsApp",
    description:
      "Elicani gives your business its own storefront. Products, customers and orders in one place — in any currency.",
    images: ["/brand/elicani-og.png"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

/**
 * `lang`/`dir` seguem o cookie `elicani_locale` — é a fundação do RTL:
 * com "ar" o documento inteiro passa a `dir="rtl"` e o layout (flex/grid
 * lógico) espelha-se sem aplicação separada. Sem cookie, "en" (default).
 *
 * A rota resolve em tempo de requisição; `instant = false` autoriza o
 * bloqueio (mesmo padrão de `app/layout`), cobrindo também o `/_not-found`.
 */
export const instant = false;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      dir={getLocaleDirection(locale)}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
