import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getMarketingUrl } from "@/lib/env";
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // A Fase 1 não expõe seletor de idioma: a UI segue o padrão ("en").
    // O canal de locale já existe (cookie `elicani_locale`) para a fase
    // em que o seletor for adicionado.
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
