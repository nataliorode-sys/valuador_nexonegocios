# Imagen de producción de NexoDirecto (monorepo: engine + web).
# Incluye Chromium (para PDF y flyer) y compila la app Next.js.
FROM node:22-bookworm-slim

WORKDIR /app
ENV PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers

# Dependencias del sistema (Prisma necesita openssl)
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Instalar dependencias (workspaces) aprovechando la cache de capas
COPY package.json package-lock.json ./
COPY engine/package.json engine/package.json
COPY web/package.json web/package.json
RUN npm ci

# Código
COPY . .

# Prisma Client + navegador Chromium + build de Next
RUN cd web && npx prisma generate
RUN cd web && npx playwright install --with-deps chromium
RUN npm run build --workspace web

EXPOSE 3000
# Al iniciar: aplica migraciones pendientes y arranca la app en el puerto del host
CMD ["sh", "-c", "cd web && npx prisma migrate deploy && npx next start -p ${PORT:-3000} -H 0.0.0.0"]
