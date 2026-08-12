// Notificaciones de negocio (buscan el destinatario y envían el email).
import { prisma } from "@/lib/prisma";
import { enviarEmail, layout } from "@/lib/email";
import { baseUrl } from "@/lib/seo";

const APP = process.env.APP_BASE_URL ? baseUrl() : "";

/** Nueva consulta de un comprador → avisa al vendedor. */
export async function notificarNuevoLead(
  publicacionId: string,
  lead: { nombre: string; email: string | null; telefono: string | null; mensaje: string },
): Promise<void> {
  const pub = await prisma.publicacion.findUnique({
    where: { id: publicacionId },
    include: { valuacion: { include: { user: true } } },
  });
  if (!pub) return;
  const to = pub.valuacion.user.email;
  const contacto = [lead.email, lead.telefono].filter(Boolean).join(" · ") || "sin datos";
  await enviarEmail({
    to,
    subject: `Nueva consulta por "${pub.titulo}"`,
    html: layout("Tenés una nueva consulta 🎉", `
      <p><strong>${lead.nombre}</strong> está interesado en tu empresa publicada en NexoDirecto.</p>
      <p style="background:#f8fafc;border-radius:8px;padding:12px">${lead.mensaje || "(sin mensaje)"}</p>
      <p>Contacto: ${contacto}</p>
      <p>Respondele cuanto antes para no perder la oportunidad.</p>`),
  });
}

/** Resultado de la moderación → avisa al vendedor. */
export async function notificarModeracion(valuacionId: string, aprobada: boolean, motivo?: string): Promise<void> {
  const val = await prisma.valuacion.findUnique({
    where: { id: valuacionId },
    include: { user: true, publicacion: true },
  });
  if (!val) return;
  const to = val.user.email;
  if (aprobada) {
    const url = APP ? `${APP}/empresa/${val.publicacion?.codigo}` : "tu panel de NexoDirecto";
    await enviarEmail({
      to,
      subject: "Tu publicación ya está online",
      html: layout("¡Tu empresa está publicada! ✅", `
        <p>Aprobamos tu publicación y ya está visible en el Marketplace de NexoNegocios por 100 días.</p>
        <p>Verla: ${APP ? `<a href="${url}">${url}</a>` : url}</p>
        <p>Compartí tu flyer para llegar a más compradores.</p>`),
    });
  } else {
    await enviarEmail({
      to,
      subject: "Sobre tu publicación en NexoDirecto",
      html: layout("Tu publicación necesita cambios", `
        <p>Revisamos tu publicación y no pudimos aprobarla.</p>
        <p><strong>Motivo:</strong> ${motivo || "No cumple con nuestras condiciones de publicación."}</p>
        <p>Si el pago corresponde, será reintegrado. Podés ajustar el contenido y volver a enviarla.</p>`),
    });
  }
}

/** Aviso de vencimiento (día 90 = 10 días restantes, día 99 = 1 día). */
export async function notificarVencimiento(valuacionId: string, dias: number): Promise<void> {
  const val = await prisma.valuacion.findUnique({ where: { id: valuacionId }, include: { user: true, publicacion: true } });
  if (!val) return;
  await enviarEmail({
    to: val.user.email,
    subject: `Tu publicación vence en ${dias} día${dias === 1 ? "" : "s"}`,
    html: layout(`Tu publicación vence pronto ⏳`, `
      <p>Tu empresa "${val.publicacion?.titulo}" seguirá visible ${dias} día${dias === 1 ? "" : "s"} más.</p>
      <p>Si todavía no la vendiste, podés renovar la publicación desde tu panel.</p>`),
  });
}
