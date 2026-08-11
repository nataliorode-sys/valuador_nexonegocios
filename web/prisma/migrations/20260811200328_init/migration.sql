-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('VENDEDOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "EstadoValuacion" AS ENUM ('BORRADOR', 'CALCULADA', 'PAGA', 'PUBLICACION_EN_ARMADO', 'EN_REVISION', 'PUBLICADA', 'RECHAZADA');

-- CreateEnum
CREATE TYPE "EstadoPublicacion" AS ENUM ('PUBLICADA', 'VENCIDA', 'VENDIDA', 'PAUSADA');

-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('PENDIENTE', 'APROBADO', 'RECHAZADO', 'REEMBOLSADO');

-- CreateEnum
CREATE TYPE "NivelPrivacidad" AS ENUM ('ANONIMA', 'IDENTIFICADA');

-- CreateEnum
CREATE TYPE "ResultadoModeracion" AS ENUM ('APROBADA', 'RECHAZADA');

-- CreateEnum
CREATE TYPE "Moneda" AS ENUM ('ARS', 'USD');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "nombre" TEXT,
    "telefono" TEXT,
    "emailVerificado" BOOLEAN NOT NULL DEFAULT false,
    "rol" "Rol" NOT NULL DEFAULT 'VENDEDOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Valuacion" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "estado" "EstadoValuacion" NOT NULL DEFAULT 'BORRADOR',
    "monedaCarga" "Moneda" NOT NULL DEFAULT 'ARS',
    "tcRef" DOUBLE PRECISION,
    "tcFecha" TIMESTAMP(3),
    "engineVersion" TEXT,
    "precisionPct" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Valuacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerfilNegocio" (
    "id" TEXT NOT NULL,
    "valuacionId" TEXT NOT NULL,
    "familia" TEXT NOT NULL,
    "rubroVisible" TEXT,
    "provincia" TEXT,
    "localidad" TEXT,
    "antiguedad" INTEGER,
    "empleados" INTEGER,
    "datos" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PerfilNegocio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResultadoCalculo" (
    "id" TEXT NOT NULL,
    "valuacionId" TEXT NOT NULL,
    "sdeUsd" DOUBLE PRECISION NOT NULL,
    "ebitdaUsd" DOUBLE PRECISION NOT NULL,
    "claseTamanio" TEXT NOT NULL,
    "familia" TEXT NOT NULL,
    "baseGanancia" TEXT NOT NULL,
    "multiploFinal" DOUBLE PRECISION NOT NULL,
    "valorMultiplosUsd" DOUBLE PRECISION NOT NULL,
    "valorDcfUsd" DOUBLE PRECISION,
    "valorActivosUsd" DOUBLE PRECISION NOT NULL,
    "valorCentralUsd" DOUBLE PRECISION NOT NULL,
    "rangoMinUsd" DOUBLE PRECISION NOT NULL,
    "rangoMaxUsd" DOUBLE PRECISION NOT NULL,
    "valorCentralArs" DOUBLE PRECISION NOT NULL,
    "rangoMinArs" DOUBLE PRECISION NOT NULL,
    "rangoMaxArs" DOUBLE PRECISION NOT NULL,
    "metodoPredominante" TEXT NOT NULL,
    "escenarios" JSONB NOT NULL,
    "tablaDcf" JSONB,
    "drivers" JSONB NOT NULL,
    "flags" JSONB NOT NULL,
    "engineVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResultadoCalculo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pago" (
    "id" TEXT NOT NULL,
    "valuacionId" TEXT NOT NULL,
    "proveedor" TEXT NOT NULL DEFAULT 'mercadopago',
    "estado" "EstadoPago" NOT NULL DEFAULT 'PENDIENTE',
    "montoArs" DOUBLE PRECISION NOT NULL,
    "ivaArs" DOUBLE PRECISION NOT NULL,
    "externalId" TEXT,
    "datosFactura" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Informe" (
    "id" TEXT NOT NULL,
    "valuacionId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "urlPdf" TEXT NOT NULL,
    "hash" TEXT,
    "generadoAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Informe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Publicacion" (
    "id" TEXT NOT NULL,
    "valuacionId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "precioPublicacion" DOUBLE PRECISION NOT NULL,
    "moneda" "Moneda" NOT NULL DEFAULT 'USD',
    "nivelPrivacidad" "NivelPrivacidad" NOT NULL DEFAULT 'ANONIMA',
    "configFinancieros" JSONB NOT NULL,
    "fotos" TEXT[],
    "highlights" JSONB NOT NULL,
    "selloExistencia" BOOLEAN NOT NULL DEFAULT false,
    "selloFuente" TEXT,
    "estadoPub" "EstadoPublicacion" NOT NULL DEFAULT 'PUBLICADA',
    "fechaPublicacion" TIMESTAMP(3),
    "fechaVencimiento" TIMESTAMP(3),
    "vistas" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Publicacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Flyer" (
    "id" TEXT NOT NULL,
    "valuacionId" TEXT NOT NULL,
    "plantilla" TEXT NOT NULL,
    "formatos" JSONB NOT NULL,
    "generadoAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Flyer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "publicacionId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT,
    "telefono" TEXT,
    "mensaje" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Moderacion" (
    "id" TEXT NOT NULL,
    "publicacionId" TEXT NOT NULL,
    "adminId" TEXT,
    "resultado" "ResultadoModeracion" NOT NULL,
    "motivo" TEXT,
    "checklistExistencia" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Moderacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParametrosMotor" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "vigente" BOOLEAN NOT NULL DEFAULT false,
    "params" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ParametrosMotor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rubro" (
    "id" TEXT NOT NULL,
    "nombreVisible" TEXT NOT NULL,
    "familia" TEXT NOT NULL,
    "tieneStock" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Rubro_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Valuacion_codigo_key" ON "Valuacion"("codigo");

-- CreateIndex
CREATE INDEX "Valuacion_userId_idx" ON "Valuacion"("userId");

-- CreateIndex
CREATE INDEX "Valuacion_estado_idx" ON "Valuacion"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "PerfilNegocio_valuacionId_key" ON "PerfilNegocio"("valuacionId");

-- CreateIndex
CREATE UNIQUE INDEX "ResultadoCalculo_valuacionId_key" ON "ResultadoCalculo"("valuacionId");

-- CreateIndex
CREATE UNIQUE INDEX "Pago_valuacionId_key" ON "Pago"("valuacionId");

-- CreateIndex
CREATE INDEX "Informe_valuacionId_idx" ON "Informe"("valuacionId");

-- CreateIndex
CREATE UNIQUE INDEX "Publicacion_valuacionId_key" ON "Publicacion"("valuacionId");

-- CreateIndex
CREATE UNIQUE INDEX "Publicacion_codigo_key" ON "Publicacion"("codigo");

-- CreateIndex
CREATE INDEX "Publicacion_estadoPub_idx" ON "Publicacion"("estadoPub");

-- CreateIndex
CREATE INDEX "Publicacion_fechaVencimiento_idx" ON "Publicacion"("fechaVencimiento");

-- CreateIndex
CREATE UNIQUE INDEX "Flyer_valuacionId_key" ON "Flyer"("valuacionId");

-- CreateIndex
CREATE INDEX "Lead_publicacionId_idx" ON "Lead"("publicacionId");

-- CreateIndex
CREATE INDEX "Moderacion_publicacionId_idx" ON "Moderacion"("publicacionId");

-- CreateIndex
CREATE UNIQUE INDEX "ParametrosMotor_version_key" ON "ParametrosMotor"("version");

-- CreateIndex
CREATE INDEX "Rubro_familia_idx" ON "Rubro"("familia");

-- AddForeignKey
ALTER TABLE "Valuacion" ADD CONSTRAINT "Valuacion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerfilNegocio" ADD CONSTRAINT "PerfilNegocio_valuacionId_fkey" FOREIGN KEY ("valuacionId") REFERENCES "Valuacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultadoCalculo" ADD CONSTRAINT "ResultadoCalculo_valuacionId_fkey" FOREIGN KEY ("valuacionId") REFERENCES "Valuacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_valuacionId_fkey" FOREIGN KEY ("valuacionId") REFERENCES "Valuacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Informe" ADD CONSTRAINT "Informe_valuacionId_fkey" FOREIGN KEY ("valuacionId") REFERENCES "Valuacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Publicacion" ADD CONSTRAINT "Publicacion_valuacionId_fkey" FOREIGN KEY ("valuacionId") REFERENCES "Valuacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flyer" ADD CONSTRAINT "Flyer_valuacionId_fkey" FOREIGN KEY ("valuacionId") REFERENCES "Valuacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_publicacionId_fkey" FOREIGN KEY ("publicacionId") REFERENCES "Publicacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Moderacion" ADD CONSTRAINT "Moderacion_publicacionId_fkey" FOREIGN KEY ("publicacionId") REFERENCES "Publicacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
