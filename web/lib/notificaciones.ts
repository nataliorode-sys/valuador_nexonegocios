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

/** Pago aprobado → envía el comprobante al comprador. */
export async function notificarPagoAprobado(valuacionId: string): Promise<void> {
  const val = await prisma.valuacion.findUnique({
    where: { id: valuacionId },
    include: { user: true, pago: true },
  });
  if (!val) return;
  const monto = val.pago?.montoArs ?? 150_000;
  const montoTxt = "$" + Math.round(monto).toLocaleString("es-AR");
  const fecha = new Date().toLocaleDateString("es-AR");
  const url = APP ? `${APP}/valuar/${valuacionId}/completo` : "tu panel de NexoDirecto";
  await enviarEmail({
    to: val.user.email,
    subject: `Comprobante de tu pago · ${val.codigo}`,
    html: layout("¡Gracias por tu compra! 🎉", `
      <p>Registramos tu pago del servicio NexoDirecto.</p>
      <table style="width:100%;font-size:14px;border-collapse:collapse;margin:12px 0">
        <tr><td style="color:#607083;padding:4px 0">Servicio</td><td style="text-align:right">Valuación + publicación</td></tr>
        <tr><td style="color:#607083;padding:4px 0">Referencia</td><td style="text-align:right">${val.codigo}</td></tr>
        <tr><td style="color:#607083;padding:4px 0">Fecha</td><td style="text-align:right">${fecha}</td></tr>
        <tr><td style="color:#607083;padding:4px 0;font-weight:700">Total (IVA incluido)</td><td style="text-align:right;font-weight:700">${montoTxt}</td></tr>
      </table>
      <p>Ya podés ver tu valuación completa y descargar el informe: ${APP ? `<a href="${url}">${url}</a>` : url}</p>
      <p style="color:#607083;font-size:12px">La factura fiscal se emite por separado. Ante cualquier duda, respondé este correo.</p>`),
  });
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
