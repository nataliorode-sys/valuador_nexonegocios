// Crea/actualiza el usuario admin desde ADMIN_EMAIL / ADMIN_PASSWORD.
// Si esas variables no están, no hace nada (evita crear un admin con clave por defecto).
// Se ejecuta en cada arranque (idempotente).
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const email = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
const pass = process.env.ADMIN_PASSWORD || "";

if (!email || !pass) {
  console.log("[seed-admin] ADMIN_EMAIL/ADMIN_PASSWORD no seteados: se omite.");
  process.exit(0);
}

const prisma = new PrismaClient();
const passwordHash = await bcrypt.hash(pass, 10);
await prisma.user.upsert({
  where: { email },
  update: { rol: "ADMIN", passwordHash, emailVerificado: true },
  create: { email, nombre: "Admin NexoNegocios", passwordHash, rol: "ADMIN", emailVerificado: true },
});
console.log("[seed-admin] ✔ Admin listo:", email);
await prisma.$disconnect();
