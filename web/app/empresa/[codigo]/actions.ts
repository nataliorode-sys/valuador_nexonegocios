"use server";

import { prisma } from "@/lib/prisma";
import { notificarNuevoLead } from "@/lib/notificaciones";

export interface ContactoInput {
  nombre: string;
  email: string;
  telefono: string;
  mensaje: string;
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
  const pub = await prisma.publicacion.findUnique({ where: { codigo } });
  if (!pub || pub.estadoPub !== "PUBLICADA") return { error: "La publicación no está disponible." };
  if (!data.nombre?.trim() || (!data.email?.trim() && !data.telefono?.trim())) {
    return { error: "Dejanos tu nombre y un dato de contacto." };
  }

  const lead = {
    nombre: data.nombre.trim(),
    email: data.email?.trim() || null,
    telefono: data.telefono?.trim() || null,
    mensaje: data.mensaje?.trim() || "",
  };
  await prisma.lead.create({ data: { publicacionId: pub.id, ...lead } });

  // Aviso al vendedor (no bloquea la respuesta al comprador).
  await notificarNuevoLead(pub.id, lead).catch(() => {});

  return { nombre: pub.contactoNombre, whatsapp: pub.contactoWhatsapp, email: pub.contactoEmail };
}
