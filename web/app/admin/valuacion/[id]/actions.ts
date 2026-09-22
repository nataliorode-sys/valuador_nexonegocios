"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { obtenerTcRef } from "@/lib/tc";
import { recalcularYPersistir } from "@/lib/recalculo";
import { ADMIN_CAMPOS, parseNumOrUndef } from "./fields";
import type { FormData as WizardData } from "@/lib/wizard/types";

/** Guarda los datos editados por el moderador y recalcula la valuación. Solo ADMIN. */
export async function guardarDatosAdmin(valuacionId: string, form: globalThis.FormData): Promise<void> {
  await requireAdmin();
  const val = await prisma.valuacion.findUnique({
    where: { id: valuacionId },
    include: { perfil: true },
  });
  if (!val?.perfil) redirect("/admin/moderacion");

  const datos: Record<string, unknown> = { ...(val.perfil.datos as Record<string, unknown>) };

  for (const f of ADMIN_CAMPOS) {
    const raw = form.get(f.id);
    if (f.kind === "text" || f.kind === "textarea" || f.kind === "select") {
      if (raw != null) datos[f.id] = String(raw);
    } else {
      const num = parseNumOrUndef(raw);
      if (num === undefined) delete datos[f.id];
      else datos[f.id] = num;
      if (f.kind === "moneyP") {
        datos[`${f.id}Periodo`] = form.get(`${f.id}Periodo`) === "anual" ? "anual" : "mensual";
      }
    }
  }

  await prisma.perfilNegocio.update({
    where: { valuacionId },
    data: {
      datos: datos as object,
      provincia: (datos.provincia as string) ?? undefined,
      localidad: (datos.localidad as string) ?? undefined,
      empleados: typeof datos.empleados === "number" ? (datos.empleados as number) : undefined,
    },
  });

  const tcRef = await obtenerTcRef();
  await recalcularYPersistir(valuacionId, datos as WizardData, tcRef);

  redirect(`/admin/valuacion/${valuacionId}?ok=1`);
}
