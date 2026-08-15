import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { assertOwner } from "@/lib/access";
import { marcarPagada } from "@/lib/valuaciones";
import { obtenerEstadoPago, pagoMontoValido } from "@/lib/mercadopago";

export const dynamic = "force-dynamic";

// Retorno de Checkout Pro. Verifica el pago contra la API (no confía en la query).
export default async function RetornoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ payment_id?: string; status?: string; collection_status?: string }>;
}) {
  const { id } = await params;
  await assertOwner(id);
  const sp = await searchParams;

  const val = await prisma.valuacion.findUnique({ where: { id }, select: { estado: true } });
  // Si el webhook ya lo confirmó, seguimos derecho.
  if (val && (val.estado === "PAGA" || val.estado === "PUBLICACION_EN_ARMADO" ||
      val.estado === "EN_REVISION" || val.estado === "PUBLICADA")) {
    redirect(`/valuar/${id}/completo`);
  }

  const paymentId = sp.payment_id;
  if (paymentId) {
    try {
      const estado = await obtenerEstadoPago(paymentId);
      if (estado.aprobado && estado.externalReference === id && pagoMontoValido(estado)) {
        await marcarPagada(id, estado.externalId, "mercadopago", estado.montoPagado ?? undefined);
        redirect(`/valuar/${id}/completo`);
      }
    } catch {
      /* cae al estado de "pendiente" abajo */
    }
  }

  const status = sp.status ?? sp.collection_status;
  return (
    <main className="mx-auto max-w-lg px-6 py-16 text-center">
      <div className="text-4xl">⏳</div>
      <h1 className="mt-4 text-2xl font-bold text-nexo">Estamos confirmando tu pago</h1>
      <p className="mt-2 text-slate-600">
        {status === "pending"
          ? "Tu pago quedó pendiente de acreditación. Te avisamos cuando se confirme."
          : "Si ya pagaste, puede tardar unos segundos en acreditarse. Actualizá esta página en un momento."}
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link href={`/valuar/${id}/pago/retorno`} className="rounded-lg bg-nexo px-5 py-2.5 font-semibold text-white hover:bg-nexo-dark">
          Actualizar
        </Link>
        <Link href="/panel" className="rounded-lg border border-slate-300 px-5 py-2.5 text-slate-600">Ir a mi panel</Link>
      </div>
    </main>
  );
}
