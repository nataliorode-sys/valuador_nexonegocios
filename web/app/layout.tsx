import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { baseUrl } from "@/lib/seo";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl()),
  title: {
    default: "NexoDirecto — Valuá y vendé tu empresa | NexoNegocios",
    template: "%s | NexoNegocios",
  },
  description:
    "Obtené una orientación de valuación de tu empresa, publicala en el Marketplace de NexoNegocios y generá un flyer para difundir. Autogestión, contacto directo.",
  openGraph: {
    siteName: "NexoNegocios",
    locale: "es_AR",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR" className={montserrat.variable}>
      <body className="min-h-screen bg-white font-sans text-nexo-ink">{children}</body>
    </html>
  );
}
