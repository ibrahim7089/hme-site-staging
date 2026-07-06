import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileStickyCTA from "@/components/MobileStickyCTA";
import { site } from "@/lib/site";

const display = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["500", "600", "700", "800"], variable: "--font-display" });
const body = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-body" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-mono" });

export const metadata: Metadata = {
  metadataBase: new URL(site.domain),
  title: {
    default: "HME | Currency Exchange & International Money Transfer Malaysia",
    template: "%s | HME \u2014 Hasani Munawarah Exchange",
  },
  description:
    "HME (Hasani Munawarah Exchange Sdn Bhd) is a licensed Malaysian Money Services Business offering currency exchange, international money transfer and currency booking.",
  openGraph: { siteName: "HME \u2014 HME Remit", type: "website", locale: "en_MY" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="pb-[76px] md:pb-0">
        <Header />
        <main>{children}</main>
        <Footer />
        <MobileStickyCTA />
      </body>
    </html>
  );
}
