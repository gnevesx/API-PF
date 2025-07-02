// routes/products.ts

import { Role } from '@prisma/client';
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma/client.js';

// 1. Importando os middlewares centralizados e corretos
import { verificarToken } from '../middlewares/auth.js';
import { verificarAdmin } from '../middlewares/adminAuth.js';

const router = Router();

// 2. Middlewares locais foram REMOVIDOS

// Schema para CRIAÇÃO de produto
const productSchema = z.object({
  name: z.string().min(3, { message: "Nome do produto deve possuir, no mínimo, 3 caracteres" }),
  description: z.string().min(10, { message: "Descrição do produto deve possuir, no mínimo, 10 caracteres" }).optional().nullable(),
  price: z.number().positive({ message: "Preço deve ser um número positivo" }),
  imageUrl: z.string().url({ message: "URL da imagem inválida" }).optional().nullable(),
  category: z.string().optional().nullable(),
  size: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  stock: z.number().int().min(0, { message: "Estoque deve ser um número inteiro não negativo" }).optional().default(0),
});

// SCHEMA PARA ATUALIZAÇÃO
const productUpdateSchema = z.object({
  name: z.string().min(3, { message: "Nome do produto deve possuir, no mínimo, 3 caracteres" }).optional(),
  description: z.string().min(10, { message: "Descrição do produto deve possuir, no mínimo, 10 caracteres" }).optional().nullable(),
  price: z.number().positive({ message: "Preço deve ser um número positivo" }).optional(),
  imageUrl: z.string().url({ message: "URL da imagem inválida" }).optional().nullable(),
  category: z.string().optional().nullable(),
  size: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  stock: z.number().int().min(0, { message: "Estoque deve ser um número inteiro não negativo" }).optional(),
});


// Rota: GET /products (Listar todos os produtos - Pública)
router.get("/", async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany();
    res.status(200).json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar produtos" });
  }
});

// Rota: GET /products/:id (Buscar produto por ID - Pública)
router.get("/:id", async (req: Request, res: Response) => {
  const { id } = req.params; // ID é uma string (UUID)
  try {
    const product = await prisma.product.findUnique({
      where: { id }
    });
    if (!product) {
      return res.status(404).json({ message: "Produto não encontrado" });
    }
    res.status(200).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar produto" });
  }
});

// Rota: POST /products (Criar novo produto - Apenas ADMIN)
// 3. Aplicando os middlewares importados
router.post("/", verificarToken, verificarAdmin, async (req: Request, res: Response) => {
  const validation = productSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ errors: validation.error.issues });
  }

  try {
    const newProduct = await prisma.product.create({
      data: validation.data
    });
    res.status(201).json(newProduct);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao criar produto" });
  }
});

// Rota: PUT /products/:id (Atualizar produto - Apenas ADMIN)
router.put("/:id", verificarToken, verificarAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  const validation = productUpdateSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ errors: validation.error.issues });
  }

  try {
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: validation.data
    });
    res.status(200).json(updatedProduct);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao atualizar produto" });
  }
});

// Rota: DELETE /products/:id (Deletar produto - Apenas ADMIN)
router.delete("/:id", verificarToken, verificarAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const deletedProduct = await prisma.product.delete({
      where: { id }
    });
    res.status(200).json({ message: `Produto ${deletedProduct.name} deletado com sucesso.` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao deletar produto" });
  }
});

// Rota: GET /products/search/:term (Pesquisa de produtos - Pública)
router.get("/search/:term", async (req: Request, res: Response) => {
  const { term } = req.params;

  try {
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: term, mode: "insensitive" } },
          { description: { contains: term, mode: "insensitive" } },
          { category: { contains: term, mode: "insensitive" } },
          { color: { contains: term, mode: "insensitive" } },
        ]
      }
    });
    res.status(200).json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao pesquisar produtos" });
  }
});

export default router;
