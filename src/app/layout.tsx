import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getSiteUrl } from "@/lib/env";
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
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "Elicani — Sell online, take orders on WhatsApp",
    template: "%s · Elicani",
  },
  description:
    "Elicani gives your business its own storefront. Products, customers and orders in one place — in any currency.",
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
