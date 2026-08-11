"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { valuar } from "@nexodirecto/engine";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";
import { assertOwner } from "@/lib/access";
import { crearValuacion } from "@/lib/valuaciones";
import { toEngineInput } from "@/lib/wizard/toEngineInput";
import type { FormData } from "@/lib/wizard/types";

const TC_REF = Number(process.env.TC_REF_DEFAULT ?? "1200");

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

/** Ejecuta el motor, persiste el resultado y pasa a CALCULADA. */
export async function calcular(valuacionId: string, data: FormData): Promise<void> {
  await guardarPaso(valuacionId, data);
  const input = toEngineInput(data, TC_REF);
  const r = valuar(input);

  await prisma.resultadoCalculo.upsert({
    where: { valuacionId },
    create: {
      valuacionId,
      sdeUsd: r.sdeUSD,
      ebitdaUsd: r.ebitdaUSD,
      claseTamanio: r.claseTamanio,
      familia: r.familia,
      baseGanancia: r.baseGanancia,
      multiploFinal: r.multiploFinal,
      valorMultiplosUsd: r.valorMultiplosUSD,
      valorDcfUsd: r.valorDcfUSD,
      valorActivosUsd: r.valorActivosUSD,
      valorCentralUsd: r.valorCentralUSD,
      rangoMinUsd: r.rangoMinUSD,
      rangoMaxUsd: r.rangoMaxUSD,
      valorCentralArs: r.valorCentralARS,
      rangoMinArs: r.rangoMinARS,
      rangoMaxArs: r.rangoMaxARS,
      metodoPredominante: r.metodoPredominante,
      escenarios: r.escenariosUSD as object,
      tablaDcf: (r.tablaDcf ?? undefined) as object | undefined,
      drivers: r.drivers as object,
      flags: r.flags as object,
      engineVersion: r.engineVersion,
    },
    update: {
      sdeUsd: r.sdeUSD,
      ebitdaUsd: r.ebitdaUSD,
      claseTamanio: r.claseTamanio,
      familia: r.familia,
      baseGanancia: r.baseGanancia,
      multiploFinal: r.multiploFinal,
      valorMultiplosUsd: r.valorMultiplosUSD,
      valorDcfUsd: r.valorDcfUSD,
      valorActivosUsd: r.valorActivosUSD,
      valorCentralUsd: r.valorCentralUSD,
      rangoMinUsd: r.rangoMinUSD,
      rangoMaxUsd: r.rangoMaxUSD,
      valorCentralArs: r.valorCentralARS,
      rangoMinArs: r.rangoMinARS,
      rangoMaxArs: r.rangoMaxARS,
      metodoPredominante: r.metodoPredominante,
      escenarios: r.escenariosUSD as object,
      tablaDcf: (r.tablaDcf ?? undefined) as object | undefined,
      drivers: r.drivers as object,
      flags: r.flags as object,
      engineVersion: r.engineVersion,
    },
  });

  await prisma.valuacion.update({
    where: { id: valuacionId },
    data: { estado: "CALCULADA", engineVersion: r.engineVersion, tcRef: TC_REF, precisionPct: r.precisionPct },
  });

  redirect(`/valuar/${valuacionId}/resultado`);
}

const PRECIO = 180_000;
const IVA = 0.21;

/**
 * Pago MOCK para desarrollo (Fase 2). En la version final lo reemplaza el
 * webhook de Mercado Pago. Marca el pago aprobado y desbloquea el resultado.
 */
export async function pagarMock(valuacionId: string): Promise<void> {
  await assertOwner(valuacionId);
  const val = await prisma.valuacion.findUnique({ where: { id: valuacionId } });
  if (!val) redirect("/");
  await prisma.pago.upsert({
    where: { valuacionId },
    create: {
      valuacionId,
      proveedor: "mock",
      estado: "APROBADO",
      montoArs: PRECIO,
      ivaArs: Math.round(PRECIO * IVA),
      externalId: `mock-${valuacionId.slice(0, 8)}`,
    },
    update: { estado: "APROBADO" },
  });
  await prisma.valuacion.update({ where: { id: valuacionId }, data: { estado: "PAGA" } });
  redirect(`/valuar/${valuacionId}/completo`);
}
