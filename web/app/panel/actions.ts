"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertOwner } from "@/lib/access";

/**
 * Da de baja (reversible) la publicación del vendedor: la saca de NexoDirecto
 * (marketplace, ficha, API, sitemap) sin borrar consultas, denuncias ni historial.
 * Se implementa como estadoPub = PAUSADA sobre una valuación ya PUBLICADA.
 */
export async function darDeBajaPublicacion(valuacionId: string): Promise<void> {
  await assertOwner(valuacionId);
  const val = await prisma.valuacion.findUnique({
    where: { id: valuacionId },
    select: { estado: true, publicacion: { select: { id: true, estadoPub: true } } },
  });
  if (!val?.publicacion) return;
  // Solo se da de baja una publicación que está online.
  if (val.estado === "PUBLICADA" && val.publicacion.estadoPub === "PUBLICADA") {
    await prisma.publicacion.update({ where: { id: val.publicacion.id }, data: { estadoPub: "PAUSADA" } });
  }
  revalidatePath("/panel");
  revalidatePath(`/panel/${valuacionId}`);
}

/** Reactiva una publicación dada de baja por el dueño (si sigue vigente). No re-modera: el contenido ya estaba aprobado. */
export async function reactivarPublicacion(valuacionId: string): Promise<void> {
  await assertOwner(valuacionId);
  const val = await prisma.valuacion.findUnique({
    where: { id: valuacionId },
    select: { estado: true, publicacion: { select: { id: true, estadoPub: true, fechaVencimiento: true } } },
  });
  const pub = val?.publicacion;
  if (!pub) return;
  const vigente = !!pub.fechaVencimiento && pub.fechaVencimiento > new Date();
  if (val!.estado === "PUBLICADA" && pub.estadoPub === "PAUSADA" && vigente) {
    await prisma.publicacion.update({ where: { id: pub.id }, data: { estadoPub: "PUBLICADA" } });
  }
  revalidatePath("/panel");
  revalidatePath(`/panel/${valuacionId}`);
}
