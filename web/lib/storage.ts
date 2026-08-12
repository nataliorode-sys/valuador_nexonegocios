// Almacenamiento de imágenes. Usa R2/S3 si está configurado (producción);
// si no, guarda en disco local (desarrollo). Misma API para los llamadores.
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

const DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
const MAX_BYTES = 5 * 1024 * 1024;
const MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const EXT_MIME: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };
const PREFIX = "uploads";

function s3Habilitado(): boolean {
  return !!(process.env.S3_ENDPOINT && process.env.S3_BUCKET && process.env.S3_ACCESS_KEY && process.env.S3_SECRET_KEY);
}

let _client: S3Client | null = null;
function s3(): S3Client {
  if (!_client) {
    _client = new S3Client({
      region: process.env.S3_REGION || "auto", // R2 usa "auto"
      endpoint: process.env.S3_ENDPOINT,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY as string,
        secretAccessKey: process.env.S3_SECRET_KEY as string,
      },
      forcePathStyle: true, // compatible con R2 y S3
    });
  }
  return _client;
}

/** Guarda una imagen y devuelve la URL servible. */
export async function guardarImagen(buf: Buffer, mime: string): Promise<string> {
  const ext = MIME_EXT[mime];
  if (!ext) throw new Error("Formato no soportado. Usá JPG, PNG o WebP.");
  if (buf.length > MAX_BYTES) throw new Error("La imagen supera 5 MB.");
  const name = `${randomUUID()}.${ext}`;

  if (s3Habilitado()) {
    await s3().send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: `${PREFIX}/${name}`,
        Body: buf,
        ContentType: mime,
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
    // Si hay dominio público (bucket público o custom domain), servir directo;
    // si no, servir vía /api/media (que hace getObject).
    const pub = process.env.S3_PUBLIC_URL?.replace(/\/$/, "");
    return pub ? `${pub}/${PREFIX}/${name}` : `/api/media/${name}`;
  }

  // Disco (desarrollo)
  if (!existsSync(DIR)) await mkdir(DIR, { recursive: true });
  await writeFile(path.join(DIR, name), buf);
  return `/api/media/${name}`;
}

/** Lee una imagen servida por /api/media (disco o S3). */
export async function leerImagen(name: string): Promise<{ buf: Buffer; mime: string } | null> {
  if (!/^[a-f0-9-]+\.(jpg|png|webp)$/.test(name)) return null; // sanitiza el nombre
  const ext = name.split(".").pop() as string;
  const mime = EXT_MIME[ext] ?? "application/octet-stream";

  if (s3Habilitado()) {
    try {
      const res = await s3().send(new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: `${PREFIX}/${name}` }));
      const bytes = await res.Body?.transformToByteArray();
      if (!bytes) return null;
      return { buf: Buffer.from(bytes), mime: res.ContentType || mime };
    } catch {
      return null;
    }
  }

  const file = path.join(DIR, name);
  if (!existsSync(file)) return null;
  return { buf: await readFile(file), mime };
}
