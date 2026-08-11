import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NexoDirecto — Valuá y vendé tu empresa",
  description:
    "Obtené una orientación de valuación de tu empresa, publicala en el Marketplace de NexoNegocios y generá un flyer para difundir. Autogestión, contacto directo.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR">
      <body className="min-h-screen bg-white text-slate-900">{children}</body>
    </html>
  );
}
