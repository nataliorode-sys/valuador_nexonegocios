// Sirve las imágenes subidas desde el almacenamiento.
import { leerImagen } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const img = await leerImagen(name);
  if (!img) return new Response("No encontrado", { status: 404 });
  return new Response(new Uint8Array(img.buf), {
    headers: {
      "Content-Type": img.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
