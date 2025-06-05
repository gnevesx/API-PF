/*
  Warnings:

  - You are about to drop the `carrinhos` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `categorias` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `fotos_roupas` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `itens_carrinho` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `itens_pedido` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `pedidos` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `roupas` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tamanhos` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tamanhos_roupas_estoque` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'VISITOR');

-- DropForeignKey
ALTER TABLE "carrinhos" DROP CONSTRAINT "carrinhos_userId_fkey";

-- DropForeignKey
ALTER TABLE "fotos_roupas" DROP CONSTRAINT "fotos_roupas_roupaId_fkey";

-- DropForeignKey
ALTER TABLE "itens_carrinho" DROP CONSTRAINT "itens_carrinho_carrinhoId_fkey";

-- DropForeignKey
ALTER TABLE "itens_carrinho" DROP CONSTRAINT "itens_carrinho_roupaId_fkey";

-- DropForeignKey
ALTER TABLE "itens_carrinho" DROP CONSTRAINT "itens_carrinho_tamanhoId_fkey";

-- DropForeignKey
ALTER TABLE "itens_pedido" DROP CONSTRAINT "itens_pedido_pedidoId_fkey";

-- DropForeignKey
ALTER TABLE "itens_pedido" DROP CONSTRAINT "itens_pedido_roupaId_fkey";

-- DropForeignKey
ALTER TABLE "itens_pedido" DROP CONSTRAINT "itens_pedido_tamanhoId_fkey";

-- DropForeignKey
ALTER TABLE "pedidos" DROP CONSTRAINT "pedidos_userId_fkey";

-- DropForeignKey
ALTER TABLE "roupas" DROP CONSTRAINT "roupas_categoriaId_fkey";

-- DropForeignKey
ALTER TABLE "tamanhos_roupas_estoque" DROP CONSTRAINT "tamanhos_roupas_estoque_roupaId_fkey";

-- DropForeignKey
ALTER TABLE "tamanhos_roupas_estoque" DROP CONSTRAINT "tamanhos_roupas_estoque_tamanhoId_fkey";

-- DropTable
DROP TABLE "carrinhos";

-- DropTable
DROP TABLE "categorias";

-- DropTable
DROP TABLE "fotos_roupas";

-- DropTable
DROP TABLE "itens_carrinho";

-- DropTable
DROP TABLE "itens_pedido";

-- DropTable
DROP TABLE "pedidos";

-- DropTable
DROP TABLE "roupas";

-- DropTable
DROP TABLE "tamanhos";

-- DropTable
DROP TABLE "tamanhos_roupas_estoque";

-- DropTable
DROP TABLE "users";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'VISITOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "imageUrl" TEXT,
    "category" TEXT,
    "size" TEXT,
    "color" TEXT,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cart" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartItem" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Cart_userId_key" ON "Cart"("userId");

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
