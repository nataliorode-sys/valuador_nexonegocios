// Integración con Mercado Pago (Checkout Pro).
// Activa por variable de entorno: si no hay MP_ACCESS_TOKEN, el sistema usa el
// pago simulado (desarrollo). Con el token, cobra de verdad.
import { MercadoPagoConfig, Preference, Payment, PaymentRefund } from "mercadopago";

export const MONTO_TOTAL = 150_000; // precio final (IVA incluido)

export function mpHabilitado(): boolean {
  return !!process.env.MP_ACCESS_TOKEN;
}

/**
 * El pago simulado SOLO se permite fuera de producción y cuando MP no está configurado.
 * En producción, si falta el token, la app debe fallar cerrada (nunca regalar el producto).
 */
export function mockPagoPermitido(): boolean {
  return process.env.NODE_ENV !== "production" && !mpHabilitado();
}

function client(): MercadoPagoConfig {
  return new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN as string });
}

/** Crea una preferencia de Checkout Pro y devuelve la URL a la que redirigir. */
export async function crearPreferencia(opts: {
  valuacionId: string;
  titulo: string;
  baseUrl: string;
}): Promise<string> {
  const pref = new Preference(client());
  const res = await pref.create({
    body: {
      items: [
        {
          id: opts.valuacionId,
          title: opts.titulo,
          quantity: 1,
          unit_price: MONTO_TOTAL,
          currency_id: "ARS",
        },
      ],
      external_reference: opts.valuacionId,
      back_urls: {
        success: `${opts.baseUrl}/valuar/${opts.valuacionId}/pago/retorno`,
        pending: `${opts.baseUrl}/valuar/${opts.valuacionId}/pago/retorno`,
        failure: `${opts.baseUrl}/valuar/${opts.valuacionId}/pago`,
      },
      auto_return: "approved",
      notification_url: `${opts.baseUrl}/api/mp/webhook`,
      statement_descriptor: "NEXODIRECTO",
    },
  });
  const url = res.init_point;
  if (!url) throw new Error("Mercado Pago no devolvió init_point");
  return url;
}

export interface EstadoPagoMP {
  aprobado: boolean;
  status: string;
  externalReference: string | null;
  externalId: string;
  montoPagado: number | null;
  moneda: string | null;
}

/** Consulta un pago por id y devuelve su estado (fuente de verdad, no la query). */
export async function obtenerEstadoPago(paymentId: string): Promise<EstadoPagoMP> {
  const payment = new Payment(client());
  const p = await payment.get({ id: paymentId });
  return {
    aprobado: p.status === "approved",
    status: p.status ?? "unknown",
    externalReference: p.external_reference ?? null,
    externalId: String(p.id ?? paymentId),
    montoPagado: typeof p.transaction_amount === "number" ? p.transaction_amount : null,
    moneda: p.currency_id ?? null,
  };
}

/** Valida que el pago aprobado sea por el monto y moneda esperados (defensa en profundidad). */
export function pagoMontoValido(e: EstadoPagoMP): boolean {
  return e.montoPagado != null && e.montoPagado >= MONTO_TOTAL && e.moneda === "ARS";
}

/** Reembolso total de un pago aprobado. Lanza si MP no confirma el reintegro. */
export async function reembolsarPago(paymentId: string): Promise<void> {
  const refund = new PaymentRefund(client());
  await refund.create({ payment_id: paymentId, body: {} });
}
