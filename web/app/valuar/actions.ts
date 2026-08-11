"use server";

import { redirect } from "next/navigation";
import { valuar } from "@nexodirecto/engine";
import { prisma } from "@/lib/prisma";
import { ensureUserId } from "@/lib/session";
import { toEngineInput } from "@/lib/wizard/toEngineInput";
import type { FormData } from "@/lib/wizard/types";

const TC_REF = Number(process.env.TC_REF_DEFAULT ?? "1200");

async function generarCodigo(): Promise<string> {
  const seq = (await prisma.valuacion.count()) + 1;
  return `ND-2026-${String(seq).padStart(6, "0")}`;
}

/** S5 Elegibilidad → crea la valuacion y su perfil inicial, redirige al wizard. */
export async function iniciarValuacion(form: globalThis.FormData): Promise<void> {
  const userId = await ensureUserId();
  const datosIniciales: FormData = {
    familia: String(form.get("familia") ?? ""),
    enMarcha: form.get("enMarcha") === "si",
    antiguedadElg: Number(form.get("antiguedad") ?? 0),
    facturacionRango: String(form.get("facturacionRango") ?? ""),
    datosMano: String(form.get("datosMano") ?? ""),
  };
  const codigo = await generarCodigo();
  const valuacion = await prisma.valuacion.create({
    data: {
      codigo,
      userId,
      estado: "BORRADOR",
      perfil: {
        create: {
          familia: datosIniciales.familia as string,
          datos: datosIniciales as object,
        },
      },
    },
  });
  redirect(`/valuar/${valuacion.id}`);
}

/** Autoguardado de un paso del wizard. */
export async function guardarPaso(valuacionId: string, data: FormData): Promise<{ ok: boolean }> {
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
