// Endpoint para un cron diario: avisa vencimientos (10 días y 1 día) y marca
// como VENCIDA las publicaciones expiradas. Proteger con CRON_SECRET.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notificarVencimiento } from "@/lib/notificaciones";

export const dynamic = "force-dynamic";
const DAY = 86_400_000;

function autorizado(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  // Solo por header (nunca por query string, que se filtra en logs/proxies).
  const header = req.headers.get("x-cron-secret") || req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return header === secret;
}

export async function GET(req: Request) {
  if (!autorizado(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const now = new Date();
  const in1d = new Date(now.getTime() + DAY);
  const in10d = new Date(now.getTime() + 10 * DAY);

  // Día 99 (vence en ≤1 día)
  const d99 = await prisma.publicacion.findMany({
    where: { estadoPub: "PUBLICADA", fechaVencimiento: { gt: now, lte: in1d }, avisoVencimiento: { lt: 99 } },
    select: { id: true, valuacionId: true },
  });
  for (const p of d99) {
    await notificarVencimiento(p.valuacionId, 1).catch(() => {});
    await prisma.publicacion.update({ where: { id: p.id }, data: { avisoVencimiento: 99 } });
  }

  // Día 90 (vence en ≤10 días)
  const d90 = await prisma.publicacion.findMany({
    where: { estadoPub: "PUBLICADA", fechaVencimiento: { gt: in1d, lte: in10d }, avisoVencimiento: { lt: 90 } },
    select: { id: true, valuacionId: true },
  });
  for (const p of d90) {
    await notificarVencimiento(p.valuacionId, 10).catch(() => {});
    await prisma.publicacion.update({ where: { id: p.id }, data: { avisoVencimiento: 90 } });
  }

  // Expirar las vencidas
  const expiradas = await prisma.publicacion.updateMany({
    where: { estadoPub: "PUBLICADA", fechaVencimiento: { lte: now } },
    data: { estadoPub: "VENCIDA" },
  });

  return NextResponse.json({ aviso10dias: d90.length, aviso1dia: d99.length, vencidas: expiradas.count });
}
