// Webhook de Mercado Pago: confirma el pago de forma asíncrona (fuente de verdad).
// Requiere URL pública (en dev, el retorno también verifica y desbloquea).
import { NextResponse } from "next/server";
import { marcarPagada } from "@/lib/valuaciones";
import { obtenerEstadoPago } from "@/lib/mercadopago";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    let paymentId = url.searchParams.get("data.id") || url.searchParams.get("id");
    const topic = url.searchParams.get("type") || url.searchParams.get("topic");

    if (!paymentId) {
      const body = await req.json().catch(() => null);
      if (body?.type && body.type !== "payment") return NextResponse.json({ ok: true });
      paymentId = body?.data?.id ? String(body.data.id) : null;
    } else if (topic && topic !== "payment") {
      return NextResponse.json({ ok: true });
    }

    if (!paymentId) return NextResponse.json({ ok: true });

    const estado = await obtenerEstadoPago(paymentId);
    if (estado.aprobado && estado.externalReference) {
      await marcarPagada(estado.externalReference, estado.externalId, "mercadopago");
    }
    return NextResponse.json({ ok: true });
  } catch {
    // Responder 200 igual: MP reintenta ante errores, no queremos loops.
    return NextResponse.json({ ok: true });
  }
}
