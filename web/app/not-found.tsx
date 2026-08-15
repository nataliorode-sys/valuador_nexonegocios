import Link from "next/link";
import Logo from "@/components/Logo";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-6 py-16 text-center">
      <Logo className="text-base" />
      <div className="mt-8 text-4xl">🔍</div>
      <h1 className="mt-4 text-2xl font-bold text-nexo">No encontramos esta página</h1>
      <p className="mt-2 text-slate-600">
        Puede que el enlace sea viejo, la publicación ya no esté disponible o no tengas acceso.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/" className="rounded-lg bg-nexo px-5 py-2.5 font-semibold text-white hover:bg-nexo-dark">
          Ir al inicio
        </Link>
        <Link href="/marketplace" className="rounded-lg border border-slate-300 px-5 py-2.5 text-slate-600 hover:text-nexo">
          Ver empresas en venta
        </Link>
      </div>
    </main>
  );
}
