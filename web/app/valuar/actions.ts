"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";
import { assertOwner } from "@/lib/access";
import { crearValuacion, marcarPagada } from "@/lib/valuaciones";
import { recalcularYPersistir } from "@/lib/recalculo";
import { crearPreferencia, mockPagoPermitido } from "@/lib/mercadopago";
import { baseUrl as siteBaseUrl } from "@/lib/seo";
import { obtenerTcRef } from "@/lib/tc";
import type { FormData } from "@/lib/wizard/types";

/**
 * S5 Elegibilidad. Si el usuario NO está logueado, guarda las respuestas en una
 * cookie y lo manda a registrarse (A2-A: cuenta después de la elegibilidad).
 * Si está logueado, crea la valuación y entra al wizard.
 */
export async function iniciarValuacion(form: globalThis.FormData): Promise<void> {
  const datosIniciales: FormData = {
    familia: String(form.get("familia") ?? ""),
    enMarcha: form.get("enMarcha") === "si",
    antiguedadElg: Number(form.get("antiguedad") ?? 0),
    facturacionRango: String(form.get("facturacionRango") ?? ""),
    datosMano: String(form.get("datosMano") ?? ""),
  };

  const userId = await getUserId();
  if (!userId) {
    const store = await cookies();
    store.set("nd_pending", JSON.stringify(datosIniciales), {
      httpOnly: true, sameSite: "lax", path: "/", maxAge: 3600,
    });
    redirect("/registro");
  }

  const valuacion = await crearValuacion(userId, datosIniciales);
  redirect(`/valuar/${valuacion.id}`);
}

/** Autoguardado de un paso del wizard. */
export async function guardarPaso(valuacionId: string, data: FormData): Promise<{ ok: boolean }> {
  await assertOwner(valuacionId);
  await prisma.perfilNegocio.update({
    where: { valuacionId },
    data: {
      datos: data as object,
      familia: (data.familia as string) ?? undefined,
      provincia: (data.provincia as string) ?? undefined,
      localidad: (data.localidad as string) ?? undefined,
      empleados: typeof data.empleados === "number" ? data.empleados : undefined,
    },
  });
  await prisma.valuacion.update({ where: { id: valuacionId }, data: { updatedAt: new Date() } });
  return { ok: true };
}

/**
 * Ejecuta el motor y persiste el resultado.
 * - Si la valuación aún no fue pagada, pasa a CALCULADA y muestra el resultado (con paywall).
 * - Si ya fue pagada/publicada (edición posterior), recalcula SIN volver a cobrar,
 *   conserva el estado y devuelve al resultado desbloqueado.
 */
export async function calcular(valuacionId: string, data: FormData): Promise<void> {
  await guardarPaso(valuacionId, data);
  const tcRef = await obtenerTcRef();
  const { yaProcesada } = await recalcularYPersistir(valuacionId, data, tcRef);
  redirect(yaProcesada ? `/valuar/${valuacionId}/completo` : `/valuar/${valuacionId}/resultado`);
}

/**
 * Inicia el pago con Mercado Pago (Checkout Pro): crea la preferencia y redirige
 * al checkout. Al volver, /valuar/[id]/pago/retorno verifica y desbloquea.
 */
export async function iniciarPagoMP(valuacionId: string): Promise<void> {
  await assertOwner(valuacionId);
  const val = await prisma.valuacion.findUnique({
    where: { id: valuacionId },
    include: { publicacion: true },
  });
  if (!val) redirect("/");

  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("host");
  const base = process.env.APP_BASE_URL ? siteBaseUrl() : `${proto}://${host}`;

  const url = await crearPreferencia({
    valuacionId,
    titulo: "NexoDirecto · Valuación y publicación",
    baseUrl: base,
  });
  redirect(url);
}

/**
 * Pago MOCK para desarrollo (cuando Mercado Pago no está configurado).
 * Marca el pago aprobado y desbloquea el resultado.
 */
export async function pagarMock(valuacionId: string): Promise<void> {
  // Gate de servidor: el pago simulado NUNCA debe poder invocarse en producción,
  // aunque la UI oculte el botón (la server action es invocable por POST directo).
  if (!mockPagoPermitido()) throw new Error("El pago simulado no está disponible.");
  await assertOwner(valuacionId);
  await marcarPagada(valuacionId, `mock-${valuacionId.slice(0, 8)}`, "mock");
  redirect(`/valuar/${valuacionId}/completo`);
}
