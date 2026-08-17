-- CreateTable
CREATE TABLE "Denuncia" (
    "id" TEXT NOT NULL,
    "publicacionId" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Denuncia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Denuncia_publicacionId_idx" ON "Denuncia"("publicacionId");

-- AddForeignKey
ALTER TABLE "Denuncia" ADD CONSTRAINT "Denuncia_publicacionId_fkey" FOREIGN KEY ("publicacionId") REFERENCES "Publicacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
