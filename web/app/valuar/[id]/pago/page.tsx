import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { assertOwner } from "@/lib/access";
import { pagarMock } from "../../actions";

export const dynamic = "force-dynamic";

// S8 — Checkout. Version mock (Fase 2). Mercado Pago se integra en la Fase 2 final.
export default async function PagoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await assertOwner(id);
  const valuacion = await prisma.valuacion.findUnique({ where: { id } });
  if (!valuacion) notFound();

  const pagar = pagarMock.bind(null, id);

  return (
    <main className="mx-auto max-w-lg px-6 py-12">
      <h1 className="text-2xl font-bold text-nexo">Desbloqueá tu valuación completa</h1>
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-sm font-semibold uppercase text-slate-400">Incluye</div>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          <li>✓ Valor orientativo y rango (USD y ARS)</li>
          <li>✓ Informe profesional en PDF</li>
          <li>✓ Publicación 100 días en el Marketplace</li>
          <li>✓ Flyer para difundir</li>
        </ul>
        <div className="mt-6 flex items-baseline justify-between border-t border-slate-100 pt-4">
          <span className="text-slate-600">Total</span>
          <span className="text-2xl font-bold text-nexo">$180.000 <span className="text-sm font-normal text-slate-500">+ IVA</span></span>
        </div>

        <form action={pagar} className="mt-6">
          <button type="submit" className="w-full rounded-lg bg-nexo px-6 py-3 font-semibold text-white hover:bg-nexo-dark">
            Pagar (simulado)
          </button>
        </form>
        <p className="mt-2 text-center text-xs text-amber-600">
          Modo desarrollo: pago simulado. La integración con Mercado Pago requiere las credenciales.
        </p>
      </div>
      <div className="mt-4 text-center text-sm">
        <Link href={`/valuar/${id}/resultado`} className="text-slate-500 hover:text-nexo">← Volver</Link>
      </div>
    </main>
  );
}
