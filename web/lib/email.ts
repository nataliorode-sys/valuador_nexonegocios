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
  return `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#0f172a">
    <div style="background:#0B3B6F;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0;font-weight:700;font-size:18px">
      Nexo<span style="color:#1F9D8F">Directo</span>
    </div>
    <div style="border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;padding:24px">
      <h1 style="font-size:20px;margin:0 0 12px">${titulo}</h1>
      ${cuerpo}
      <p style="color:#94a3b8;font-size:12px;margin-top:24px">NexoNegocios · NexoDirecto</p>
    </div>
  </div>`;
}
