// API_AULA11/routes/products.ts

import { Role } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import jwt from "jsonwebtoken";
import prisma from '../prisma/client.js'; // <-- Importação do cliente Prisma centralizado

const router = Router();

// Middleware de autenticação
const verifyToken = (req: any, res: any, next: any) => {
  const token = req.headers['x-access-token'];

  if (!token) {
    return res.status(403).json({ message: "Token não fornecido" });
  }

  try {
    const decoded = jwt.verify(token as string, process.env.JWT_KEY as string) as { userId: string, userRole: Role };
    req.userId = decoded.userId;
    req.userRole = decoded.userRole;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token inválido" });
  }
};

// Middleware para verificar se o usuário é ADMIN
const verifyAdmin = (req: any, res: any, next: any) => {
  if (req.userRole !== Role.ADMIN) {
    return res.status(403).json({ message: "Acesso negado: Requer privilégios de administrador para esta operação." });
  }
  next();
};

// Schema para CRIAÇÃO de produto (todos os campos obrigatórios, exceto opcionais explícitos)
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

// NOVO SCHEMA PARA ATUALIZAÇÃO: Todos os campos são opcionais (.optional())
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


// Rota: GET /products (Listar todos os produtos)
router.get("/", async (req, res) => {
  try {
    const products = await prisma.product.findMany();
    res.status(200).json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar produtos" });
  }
});

// Rota: GET /products/:id (Buscar produto por ID)
router.get("/:id", async (req, res) => {
  const { id } = req.params;
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
router.post("/", verifyToken, verifyAdmin, async (req, res) => {
  const validation = productSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ errors: validation.error.issues });
  }

  const { name, description, price, imageUrl, category, size, color, stock } = validation.data;

  try {
    const newProduct = await prisma.product.create({
      data: {
        name,
        description,
        price,
        imageUrl,
        category,
        size,
        color,
        stock,
      }
    });
    res.status(201).json(newProduct);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao criar produto" });
  }
});

// Rota: PUT /products/:id (Atualizar produto - Apenas ADMIN)
router.put("/:id", verifyToken, verifyAdmin, async (req, res) => {
  const { id } = req.params;
  // MUDANÇA AQUI: Usa productUpdateSchema
  const validation = productUpdateSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ errors: validation.error.issues });
  }

  try {
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: validation.data // validation.data conterá apenas os campos fornecidos
    });
    res.status(200).json(updatedProduct);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao atualizar produto" });
  }
});

// Rota: DELETE /products/:id (Deletar produto - Apenas ADMIN)
router.delete("/:id", verifyToken, verifyAdmin, async (req, res) => {
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

// Rota: GET /products/search/:term (Pesquisa de produtos)
router.get("/search/:term", async (req, res) => {
  const { term } = req.params;

  try {
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: term, mode: "insensitive" } },
          { description: { contains: term, mode: "insensitive" } },
          { category: { contains: term, mode: "insensitive" } },
          { color: { contains: term, mode: "insensitive" } },
          // Adicione mais campos para pesquisa se desejar
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