import Link from "next/link";
import Logo from "@/components/Logo";
import { signOut } from "@/auth";

// Header liviano para el embudo de valuación: da orientación (logo → panel) y salida
// (cerrar sesión) durante el flujo largo. No se usa en /informe ni /flyer (se renderizan a PDF/PNG).
export default function FunnelHeader() {
  return (
    <header className="border-b border-nexo-border bg-white">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/panel" className="flex items-center gap-2 text-sm" aria-label="Ir a mi panel">
          <Logo />
        </Link>
        <div className="flex items-center gap-3 text-sm">
          <Link href="/panel" className="text-slate-500 hover:text-nexo">Mi panel</Link>
          <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
            <button className="text-slate-500 hover:text-nexo">Salir</button>
          </form>
        </div>
      </div>
    </header>
  );
}
