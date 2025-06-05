-- CreateTable
CREATE TABLE "fotos" (
    "id" SERIAL NOT NULL,
    "descricao" VARCHAR(40) NOT NULL,
    "url" TEXT NOT NULL,
    "carroId" INTEGER NOT NULL,

    CONSTRAINT "fotos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "fotos" ADD CONSTRAINT "fotos_carroId_fkey" FOREIGN KEY ("carroId") REFERENCES "carros"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
