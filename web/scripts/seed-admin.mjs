// Crea/actualiza el usuario admin. Correr: node scripts/seed-admin.mjs
// Requiere DATABASE_URL en el entorno.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const email = process.env.ADMIN_EMAIL || "admin@nexonegocios.local";
const pass = process.env.ADMIN_PASSWORD || "admin1234";
const passwordHash = await bcrypt.hash(pass, 10);

await prisma.user.upsert({
  where: { email },
  update: { rol: "ADMIN", passwordHash, emailVerificado: true },
  create: { email, nombre: "Admin NexoNegocios", passwordHash, rol: "ADMIN", emailVerificado: true },
});

console.log("✔ Admin listo:", email);
await prisma.$disconnect();
