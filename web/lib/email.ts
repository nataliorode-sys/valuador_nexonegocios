// Envío de emails transaccionales vía Resend (API REST, sin SDK).
// Gated por RESEND_API_KEY: sin la key, loguea en consola (desarrollo).
const FROM = process.env.EMAIL_FROM || "NexoDirecto <no-reply@nexodirecto.local>";

export function emailHabilitado(): boolean {
  return !!process.env.RESEND_API_KEY;
}

export async function enviarEmail(opts: { to: string; subject: string; html: string }): Promise<void> {
  if (!opts.to) return;
  if (!emailHabilitado()) {
    console.log(`[email:dev] → ${opts.to} · ${opts.subject}`);
    return;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to: opts.to, subject: opts.subject, html: opts.html }),
    });
    if (!res.ok) console.error("[email] fallo", res.status, await res.text().catch(() => ""));
  } catch (e) {
    console.error("[email] error", e instanceof Error ? e.message : e);
  }
}

/** Layout base simple y sobrio. */
export function layout(titulo: string, cuerpo: string): string {
  return `<div style="font-family:'Montserrat',Arial,sans-serif;max-width:560px;margin:0 auto;color:#132033">
    <div style="background:#0B1C2E;padding:20px 24px;border-radius:12px 12px 0 0;font-weight:800;font-size:20px">
      <span style="color:#45B649">Nexo</span><span style="color:#ffffff">Negocios</span>
    </div>
    <div style="border:1px solid #DFE6EC;border-top:none;border-radius:0 0 12px 12px;padding:24px">
      <h1 style="font-size:20px;margin:0 0 12px;color:#132033">${titulo}</h1>
      ${cuerpo}
      <p style="color:#607083;font-size:12px;margin-top:24px">NexoNegocios · Servicio NexoDirecto</p>
    </div>
  </div>`;
}
