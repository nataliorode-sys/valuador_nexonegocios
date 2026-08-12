// Almacenamiento de imágenes. Por defecto en disco (UPLOAD_DIR); en producción se
// puede reemplazar por S3 sin cambiar los llamadores (devuelve una URL servible).
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

const DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
const MAX_BYTES = 5 * 1024 * 1024;
const MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function guardarImagen(buf: Buffer, mime: string): Promise<string> {
  const ext = MIME_EXT[mime];
  if (!ext) throw new Error("Formato no soportado. Usá JPG, PNG o WebP.");
  if (buf.length > MAX_BYTES) throw new Error("La imagen supera 5 MB.");
  if (!existsSync(DIR)) await mkdir(DIR, { recursive: true });
  const name = `${randomUUID()}.${ext}`;
  await writeFile(path.join(DIR, name), buf);
  return `/api/media/${name}`;
}

export async function leerImagen(name: string): Promise<{ buf: Buffer; mime: string } | null> {
  if (!/^[a-f0-9-]+\.(jpg|png|webp)$/.test(name)) return null; // sanitiza el nombre
  const file = path.join(DIR, name);
  if (!existsSync(file)) return null;
  const buf = await readFile(file);
  const ext = name.split(".").pop();
  const mime = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
  return { buf, mime };
}
