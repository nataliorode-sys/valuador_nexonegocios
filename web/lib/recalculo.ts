// Recalcula la valuación con el motor y persiste el resultado.
// Compartido por el flujo del vendedor (calcular) y la edición de moderador.
import { valuar } from "@nexodirecto/engine";
import { prisma } from "@/lib/prisma";
import { toEngineInput } from "@/lib/wizard/toEngineInput";
import type { FormData } from "@/lib/wizard/types";

/**
 * Corre el motor sobre `data` y guarda el ResultadoCalculo.
 * - Si la valuación ya fue pagada/publicada, conserva el estado (no revierte a
 *   CALCULADA ni recobra); si aún no, la deja en CALCULADA.
 * Devuelve el resultado del motor y si ya estaba procesada.
 */
export async function recalcularYPersistir(
  valuacionId: string,
  data: FormData,
  tcRef: number,
): Promise<{ yaProcesada: boolean }> {
  const actual = await prisma.valuacion.findUnique({
    where: { id: valuacionId },
    select: { estado: true },
  });
  const yaProcesada = actual != null && actual.estado !== "BORRADOR" && actual.estado !== "CALCULADA";

  const r = valuar(toEngineInput(data, tcRef));

  const campos = {
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
  };

  await prisma.resultadoCalculo.upsert({
    where: { valuacionId },
    create: { valuacionId, ...campos },
    update: campos,
  });

  await prisma.valuacion.update({
    where: { id: valuacionId },
    data: {
      estado: yaProcesada ? undefined : "CALCULADA",
      engineVersion: r.engineVersion,
      tcRef,
      precisionPct: r.precisionPct,
    },
  });

  return { yaProcesada };
}
