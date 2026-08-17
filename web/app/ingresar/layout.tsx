import type { Metadata } from "next";

// Zona privada / de flujo: no debe indexarse en buscadores.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
