-- AlterTable
ALTER TABLE "User" ADD COLUMN "terminosAceptadosEn" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "terminosVersion" TEXT;

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN "consentimiento" BOOLEAN NOT NULL DEFAULT false;
