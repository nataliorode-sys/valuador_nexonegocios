// Subida de imágenes (multipart). Requiere sesión. Devuelve las URLs servibles.
import { NextResponse } from "next/server";
import { getUserId } from "@/lib/session";
import { guardarImagen } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: Request) {
  const uid = await getUserId();
  if (!uid) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const form = await req.formData();
    const files = form.getAll("file").filter((f): f is File => f instanceof File);
    if (files.length === 0) return NextResponse.json({ error: "No se recibieron archivos." }, { status: 400 });

    const urls: string[] = [];
    for (const f of files.slice(0, 6)) {
      const buf = Buffer.from(await f.arrayBuffer());
      urls.push(await guardarImagen(buf, f.type));
    }
    return NextResponse.json({ urls });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error subiendo la imagen.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
