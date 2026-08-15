// Webhook de Mercado Pago: confirma el pago de forma asíncrona (fuente de verdad).
// Requiere URL pública (en dev, el retorno también verifica y desbloquea).
import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { marcarPagada } from "@/lib/valuaciones";
import { obtenerEstadoPago, pagoMontoValido } from "@/lib/mercadopago";

export const dynamic = "force-dynamic";

/**
 * Valida la firma x-signature de Mercado Pago (defensa en profundidad; igualmente se
 * re-consulta el pago a la API de MP como fuente de verdad). Si MP_WEBHOOK_SECRET no
 * está configurado, no bloquea (compatibilidad). Devuelve false solo si hay secret y NO valida.
 */
function firmaValida(req: Request, dataId: string | null): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return true; // sin secret configurado: no validamos (se apoya en la re-consulta)
  const sig = req.headers.get("x-signature");
  const reqId = req.headers.get("x-request-id") ?? "";
  if (!sig || !dataId) return false;
  const parts = Object.fromEntries(sig.split(",").map((p) => p.split("=").map((s) => s.trim())));
  const ts = parts["ts"];
  const v1 = parts["v1"];
  if (!ts || !v1) return false;
  const manifest = `id:${dataId};request-id:${reqId};ts:${ts};`;
  const expected = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(v1, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    let paymentId = url.searchParams.get("data.id") || url.searchParams.get("id");
    const topic = url.searchParams.get("type") || url.searchParams.get("topic");

    if (!firmaValida(req, url.searchParams.get("data.id") || url.searchParams.get("id"))) {
      return NextResponse.json({ error: "firma inválida" }, { status: 401 });
    }

    if (!paymentId) {
      const body = await req.json().catch(() => null);
      if (body?.type && body.type !== "payment") return NextResponse.json({ ok: true });
      paymentId = body?.data?.id ? String(body.data.id) : null;
    } else if (topic && topic !== "payment") {
      return NextResponse.json({ ok: true });
    }

    if (!paymentId) return NextResponse.json({ ok: true });

    const estado = await obtenerEstadoPago(paymentId);
    if (estado.aprobado && estado.externalReference && pagoMontoValido(estado)) {
      await marcarPagada(estado.externalReference, estado.externalId, "mercadopago", estado.montoPagado ?? undefined);
    }
    return NextResponse.json({ ok: true });
  } catch {
    // Responder 200 igual: MP reintenta ante errores, no queremos loops.
    return NextResponse.json({ ok: true });
  }
}
