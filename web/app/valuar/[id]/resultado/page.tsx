import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { assertOwner } from "@/lib/access";
import FunnelHeader from "@/components/FunnelHeader";

export const dynamic = "force-dynamic";

// S7 — Teaser (paywall en el medio). Muestra que el informe está listo + un
// resumen de lo cargado, pero NO el valor (ver docs/00 A2-B). Sin semáforo.
export default async function TeaserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await assertOwner(id);
  const valuacion = await prisma.valuacion.findUnique({
    where: { id },
    include: { perfil: true, resultado: true },
  });
  if (!valuacion || !valuacion.resultado) notFound();

  const perfil = valuacion.perfil?.datos as Record<string, unknown> | undefined;

  return (
    <>
      <FunnelHeader />
      <main className="mx-auto max-w-2xl px-6 py-12">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="text-4xl">✅</div>
        <h1 className="mt-4 text-2xl font-bold text-nexo">¡Tu valuación está lista!</h1>
        <p className="mt-2 text-slate-600">
          Analizamos tu negocio y calculamos un rango de valuación con método profesional
          (múltiplos de mercado, flujo de fondos y activos).
        </p>

        {/* Valor OCULTO tras el paywall */}
        <div className="relative mt-8 overflow-hidden rounded-xl border border-slate-200 bg-nexo-soft p-8">
          <div className="select-none blur-md" aria-hidden>
            <div className="text-sm text-slate-500">Valor orientativo</div>
            <div className="text-4xl font-bold text-nexo">USD ●●●.●●●</div>
            <div className="mt-1 text-slate-500">Rango: USD ●●●.●●● – ●●●.●●●</div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="rounded-full bg-white/80 px-4 py-1 text-sm font-medium text-slate-700">
              🔒 Desbloqueá el valor completo
            </span>
          </div>
        </div>

        {/* Resumen de lo cargado (validacion, sin valores sensibles) */}
        <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50 p-4 text-left">
          <div className="text-xs font-semibold uppercase text-slate-400">Sobre tu negocio</div>
          <ul className="mt-2 space-y-1 text-sm text-slate-600">
            <li>Actividad: {String(perfil?.actividadDesc ?? "—").slice(0, 80)}</li>
            <li>Ubicación: {String(perfil?.localidad ?? "—")}, {String(perfil?.provincia ?? "—")}</li>
            <li>Precisión de la estimación: {valuacion.precisionPct ?? "—"}%</li>
          </ul>
        </div>

        <div className="mt-8">
          <Link href={`/valuar/${id}/pago`}
            className="block w-full rounded-lg bg-nexo px-6 py-3 font-semibold text-white hover:bg-nexo-dark">
            Desbloquear por $150.000 ARS
          </Link>
          <p className="mt-2 text-xs text-slate-400">Valor, informe PDF, publicación y flyer.</p>
        </div>

        <div className="mt-6 text-sm">
          <Link href={`/valuar/${id}`} className="text-slate-500 hover:text-nexo">← Editar mis datos</Link>
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-slate-400">
        Orientación basada en información provista por el propietario, no verificada. No constituye
        tasación ni asesoramiento.
      </p>
      </main>
    </>
  );
}
