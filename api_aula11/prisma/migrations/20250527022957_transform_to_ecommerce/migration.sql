/*
  Warnings:

  - You are about to drop the `carros` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `clientes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `fotos` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `marcas` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `propostas` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "carros" DROP CONSTRAINT "carros_marcaId_fkey";

-- DropForeignKey
ALTER TABLE "fotos" DROP CONSTRAINT "fotos_carroId_fkey";

-- DropForeignKey
ALTER TABLE "propostas" DROP CONSTRAINT "propostas_carroId_fkey";

-- DropForeignKey
ALTER TABLE "propostas" DROP CONSTRAINT "propostas_clienteId_fkey";

-- DropTable
DROP TABLE "carros";

-- DropTable
DROP TABLE "clientes";

-- DropTable
DROP TABLE "fotos";

-- DropTable
DROP TABLE "marcas";

-- DropTable
DROP TABLE "propostas";

-- DropEnum
DROP TYPE "Combustiveis";

-- CreateTable
CREATE TABLE "users" (
    "id" VARCHAR(36) NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "email" VARCHAR(40) NOT NULL,
    "password" VARCHAR(60) NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(50) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tamanhos" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(10) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tamanhos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roupas" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "descricao" VARCHAR(500),
    "preco" DECIMAL(10,2) NOT NULL,
    "imagemPrincipalUrl" TEXT,
    "categoriaId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roupas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fotos_roupas" (
    "id" SERIAL NOT NULL,
    "descricao" VARCHAR(100),
    "url" TEXT NOT NULL,
    "roupaId" INTEGER NOT NULL,

    CONSTRAINT "fotos_roupas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tamanhos_roupas_estoque" (
    "id" SERIAL NOT NULL,
    "roupaId" INTEGER NOT NULL,
    "tamanhoId" INTEGER NOT NULL,
    "estoque" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "tamanhos_roupas_estoque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_pedido" (
    "id" SERIAL NOT NULL,
    "pedidoId" INTEGER NOT NULL,
    "roupaId" INTEGER NOT NULL,
    "tamanhoId" INTEGER NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "precoUnitario" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "itens_pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carrinhos" (
    "id" VARCHAR(36) NOT NULL,
    "userId" VARCHAR(36) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "carrinhos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_carrinho" (
    "id" SERIAL NOT NULL,
    "carrinhoId" VARCHAR(36) NOT NULL,
    "roupaId" INTEGER NOT NULL,
    "tamanhoId" INTEGER NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "itens_carrinho_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos" (
    "id" SERIAL NOT NULL,
    "userId" VARCHAR(36) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_nome_key" ON "categorias"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "tamanhos_nome_key" ON "tamanhos"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "tamanhos_roupas_estoque_roupaId_tamanhoId_key" ON "tamanhos_roupas_estoque"("roupaId", "tamanhoId");

-- CreateIndex
CREATE UNIQUE INDEX "carrinhos_userId_key" ON "carrinhos"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "itens_carrinho_carrinhoId_roupaId_tamanhoId_key" ON "itens_carrinho"("carrinhoId", "roupaId", "tamanhoId");

-- AddForeignKey
ALTER TABLE "roupas" ADD CONSTRAINT "roupas_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fotos_roupas" ADD CONSTRAINT "fotos_roupas_roupaId_fkey" FOREIGN KEY ("roupaId") REFERENCES "roupas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tamanhos_roupas_estoque" ADD CONSTRAINT "tamanhos_roupas_estoque_roupaId_fkey" FOREIGN KEY ("roupaId") REFERENCES "roupas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tamanhos_roupas_estoque" ADD CONSTRAINT "tamanhos_roupas_estoque_tamanhoId_fkey" FOREIGN KEY ("tamanhoId") REFERENCES "tamanhos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_pedido" ADD CONSTRAINT "itens_pedido_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_pedido" ADD CONSTRAINT "itens_pedido_roupaId_fkey" FOREIGN KEY ("roupaId") REFERENCES "roupas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_pedido" ADD CONSTRAINT "itens_pedido_tamanhoId_fkey" FOREIGN KEY ("tamanhoId") REFERENCES "tamanhos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carrinhos" ADD CONSTRAINT "carrinhos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_carrinho" ADD CONSTRAINT "itens_carrinho_carrinhoId_fkey" FOREIGN KEY ("carrinhoId") REFERENCES "carrinhos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_carrinho" ADD CONSTRAINT "itens_carrinho_roupaId_fkey" FOREIGN KEY ("roupaId") REFERENCES "roupas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_carrinho" ADD CONSTRAINT "itens_carrinho_tamanhoId_fkey" FOREIGN KEY ("tamanhoId") REFERENCES "tamanhos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
