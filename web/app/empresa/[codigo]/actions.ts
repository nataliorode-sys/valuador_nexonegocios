"use server";

import { prisma } from "@/lib/prisma";
import { notificarNuevoLead } from "@/lib/notificaciones";
import { permitir, clientIp } from "@/lib/rateLimit";

export interface ContactoInput {
  nombre: string;
  email: string;
  telefono: string;
  mensaje: string;
  consentimiento: boolean;
}

export interface ContactoRevelado {
  nombre: string | null;
  whatsapp: string | null;
  email: string | null;
}

// S3b — Relay: registra el lead y revela el contacto del vendedor (A2-F).
export async function enviarContacto(
  codigo: string,
  data: ContactoInput,
): Promise<ContactoRevelado | { error: string }> {
  const ip = await clientIp();
  if (!permitir(`contacto:${ip}`, 6, 10 * 60_000)) {
    return { error: "Enviaste muchas consultas seguidas. Esperá unos minutos." };
  }

  const pub = await prisma.publicacion.findUnique({
    where: { codigo },
    include: { valuacion: { select: { estado: true } } },
  });
  const vigente = !!pub?.fechaVencimiento && pub.fechaVencimiento > new Date();
  if (!pub || pub.estadoPub !== "PUBLICADA" || pub.valuacion?.estado !== "PUBLICADA" || !vigente) {
    return { error: "La publicación no está disponible." };
  }
  if (!data.consentimiento) {
    return { error: "Necesitamos tu consentimiento para compartir tus datos con el vendedor." };
  }
  if (!data.nombre?.trim() || (!data.email?.trim() && !data.telefono?.trim())) {
    return { error: "Dejanos tu nombre y un dato de contacto." };
  }

  const lead = {
    nombre: data.nombre.trim(),
    email: data.email?.trim() || null,
    telefono: data.telefono?.trim() || null,
    mensaje: data.mensaje?.trim() || "",
    consentimiento: true,
  };
  await prisma.lead.create({ data: { publicacionId: pub.id, ...lead } });

  // Aviso al vendedor (no bloquea la respuesta al comprador).
  await notificarNuevoLead(pub.id, lead).catch(() => {});

  return { nombre: pub.contactoNombre, whatsapp: pub.contactoWhatsapp, email: pub.contactoEmail };
}
