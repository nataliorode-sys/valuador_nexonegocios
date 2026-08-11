/*
  Warnings:

  - Added the required column `familia` to the `Publicacion` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Publicacion" ADD COLUMN     "antiguedad" INTEGER,
ADD COLUMN     "contactoEmail" TEXT,
ADD COLUMN     "contactoNombre" TEXT,
ADD COLUMN     "contactoWhatsapp" TEXT,
ADD COLUMN     "facturacionPublica" TEXT,
ADD COLUMN     "familia" TEXT NOT NULL,
ADD COLUMN     "localidad" TEXT,
ADD COLUMN     "provincia" TEXT;
