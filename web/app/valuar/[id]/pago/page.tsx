import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { assertOwner } from "@/lib/access";
import { mpHabilitado, mockPagoPermitido } from "@/lib/mercadopago";
import FunnelHeader from "@/components/FunnelHeader";
import { iniciarPagoMP, pagarMock } from "../../actions";

export const dynamic = "force-dynamic";

// S8 — Checkout. Mercado Pago (Checkout Pro) si está configurado; si no, pago simulado.
export default async function PagoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await assertOwner(id);
  const valuacion = await prisma.valuacion.findUnique({ where: { id } });
  if (!valuacion) notFound();

  const mp = mpHabilitado();
  const mock = mockPagoPermitido();
  const pagarMercadoPago = iniciarPagoMP.bind(null, id);
  const pagar = pagarMock.bind(null, id);

  const incluye = [
    { t: "Valor orientativo y rango", d: "En USD y ARS, con escenarios." },
    { t: "Informe profesional en PDF", d: "Análisis completo, listo para compartir." },
    { t: "Publicación 100 días en el Marketplace", d: "Te encuentran compradores reales." },
    { t: "Flyer para difundir", d: "Para redes y WhatsApp." },
  ];

  return (
    <>
      <FunnelHeader />
      <main className="mx-auto max-w-lg px-6 py-12">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-nexo">Desbloqueá tu valuación completa</h1>
        <p className="mt-2 text-slate-600">Un solo pago. Todo lo que necesitás para poner tu empresa en venta.</p>
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-1.5 w-full bg-gradient-to-r from-nexo-accent to-emerald-400" />
        <div className="p-6">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Todo esto incluye</div>
          <ul className="mt-4 space-y-3">
            {incluye.map((it) => (
              <li key={it.t} className="flex gap-3">
                <Check />
                <div>
                  <div className="text-sm font-semibold text-slate-800">{it.t}</div>
                  <div className="text-xs text-slate-500">{it.d}</div>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex items-baseline justify-between rounded-xl bg-nexo-soft px-4 py-3">
            <span className="font-medium text-slate-600">Total</span>
            <span className="text-3xl font-bold text-nexo">$150.000 <span className="text-sm font-normal text-slate-500">precio final</span></span>
          </div>

        {mp ? (
          <>
            <form action={pagarMercadoPago} className="mt-6">
              <button type="submit" className="w-full rounded-lg bg-[#009ee3] px-6 py-3 font-semibold text-white hover:brightness-95">
                Pagar con Mercado Pago
              </button>
            </form>
            <p className="mt-2 text-center text-xs text-slate-400">Vas a ir al checkout seguro de Mercado Pago.</p>
          </>
        ) : mock ? (
          <>
            <form action={pagar} className="mt-6">
              <button type="submit" className="w-full rounded-lg bg-nexo px-6 py-3 font-semibold text-white hover:bg-nexo-dark">
                Pagar (simulado)
              </button>
            </form>
            <p className="mt-2 text-center text-xs text-amber-600">
              Modo desarrollo: pago simulado. Configurá MP_ACCESS_TOKEN para cobrar con Mercado Pago.
            </p>
          </>
        ) : (
          // Producción sin MP configurado: fail-closed. Nunca ofrecer el mock.
          <div className="mt-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-center text-sm text-amber-800">
            El pago no está disponible en este momento. Por favor, intentá de nuevo más tarde o
            escribinos para ayudarte.
          </div>
        )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-slate-400">
        <LockIcon /> Pago protegido · sin cargos ocultos
      </div>
      <div className="mx-auto mt-3 max-w-sm rounded-lg bg-emerald-50 px-4 py-2 text-center text-xs text-emerald-800">
        <strong>Garantía:</strong> si no aprobamos tu publicación, te devolvemos el pago.
      </div>
      <p className="mx-auto mt-3 max-w-sm text-center text-[11px] leading-relaxed text-slate-400">
        Al pagar aceptás los <Link href="/terminos" target="_blank" className="underline">Términos y Condiciones</Link>.
        Tenés derecho de arrepentimiento por 10 días corridos (Ley 24.240). La valuación es orientativa y no
        constituye una tasación ni asesoramiento.
      </p>
      <div className="mt-3 text-center text-sm">
        <Link href={`/valuar/${id}/resultado`} className="text-slate-500 hover:text-nexo">← Volver</Link>
      </div>
      </main>
    </>
  );
}

function Check() {
  return (
    <svg viewBox="0 0 24 24" className="mt-0.5 h-5 w-5 flex-none text-nexo-accent" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10" className="text-emerald-100" fill="currentColor" stroke="none" />
      <path d="M8 12.5l2.5 2.5L16 9" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="4" y="11" width="16" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}
