"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { assertOwner } from "@/lib/access";
import { buildHighlights, rangoFacturacion } from "@/lib/publicacion";

export interface PublicacionInput {
  titulo: string;
  descripcion: string;
  precioUsd: number;
  nivelPrivacidad: "ANONIMA" | "IDENTIFICADA";
  mostrarFacturacion: boolean;
  fotos: string[];
  contactoNombre: string;
  contactoWhatsapp: string;
  contactoEmail: string;
}

function ventasUsd(datos: Record<string, unknown>, tcRef: number): number {
  const modo = datos.ventasCargaModo;
  const raw = modo === "promedio" ? Number(datos.ventasProm ?? 0) * 12 : Number(datos.ventasAnual ?? 0);
  const conv = datos.monedaCarga === "USD" ? 1 : tcRef;
  return conv > 0 ? raw / conv : 0;
}

export async function guardarPublicacion(valuacionId: string, data: PublicacionInput): Promise<void> {
  await assertOwner(valuacionId);
  const val = await prisma.valuacion.findUnique({
    where: { id: valuacionId },
    include: { perfil: true, resultado: true },
  });
  if (!val || !val.perfil || !val.resultado) redirect("/");

  const datos = (val.perfil.datos ?? {}) as Record<string, unknown>;
  const anioInicio = Number(datos.anioInicio ?? 0);
  const antiguedad = anioInicio > 0 ? 2026 - anioInicio : Number(datos.antiguedadElg ?? 0) || null;
  const tc = val.tcRef ?? 1200;
  const facturacion = data.mostrarFacturacion ? rangoFacturacion(ventasUsd(datos, tc)) : null;

  const highlights = buildHighlights(
    {
      recurrencia: datos.recurrencia === true,
      dependenciaDueno: datos.dependenciaDueno as string | undefined,
      intangibles: datos.intangibles as string[] | undefined,
      incluyeVenta: datos.incluyeVenta as string[] | undefined,
      local: datos.local as string | undefined,
      inmuebleIncluido: datos.inmuebleIncluido === true,
    },
    { antiguedad, noRentable: (val.resultado.flags as { noRentable?: boolean })?.noRentable ?? false },
  );

  await prisma.publicacion.upsert({
    where: { valuacionId },
    create: {
      valuacionId,
      codigo: val.codigo,
      titulo: data.titulo,
      descripcion: data.descripcion,
      precioPublicacion: data.precioUsd,
      moneda: "USD",
      nivelPrivacidad: data.nivelPrivacidad,
      configFinancieros: { mostrarFacturacion: data.mostrarFacturacion },
      fotos: data.fotos,
      highlights,
      familia: val.perfil.familia,
      provincia: (datos.provincia as string) ?? null,
      localidad: (datos.localidad as string) ?? null,
      antiguedad,
      facturacionPublica: facturacion,
      contactoNombre: data.contactoNombre || null,
      contactoWhatsapp: data.contactoWhatsapp || null,
      contactoEmail: data.contactoEmail || null,
    },
    update: {
      titulo: data.titulo,
      descripcion: data.descripcion,
      precioPublicacion: data.precioUsd,
      nivelPrivacidad: data.nivelPrivacidad,
      configFinancieros: { mostrarFacturacion: data.mostrarFacturacion },
      fotos: data.fotos,
      highlights,
      facturacionPublica: facturacion,
      contactoNombre: data.contactoNombre || null,
      contactoWhatsapp: data.contactoWhatsapp || null,
      contactoEmail: data.contactoEmail || null,
    },
  });

  await prisma.valuacion.update({ where: { id: valuacionId }, data: { estado: "PUBLICACION_EN_ARMADO" } });
  redirect(`/valuar/${valuacionId}/publicacion`);
}

export async function enviarARevision(valuacionId: string): Promise<void> {
  await assertOwner(valuacionId);
  await prisma.valuacion.update({ where: { id: valuacionId }, data: { estado: "EN_REVISION" } });
  redirect(`/valuar/${valuacionId}/publicacion`);
}
