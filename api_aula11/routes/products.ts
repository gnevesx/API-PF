// routes/products.ts

import { Role } from '@prisma/client';
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma/client.js';

// Importando os middlewares centralizados (CORREÇÃO AQUI)
import { verificarToken } from '../middlewares/auth.js';
// CORREÇÃO: Importa os novos middlewares verificarFullAdmin e verificarEditorAdmin
import { verificarFullAdmin, verificarEditorAdmin } from '../middlewares/adminAuth.js';

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


// ====================================================================
// ROTAS AJUSTADAS NA ORDEM CORRETA
// (Rotas mais específicas ou sem parâmetros DEPOIS das com parâmetros)
// ====================================================================

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

// Rota: GET /products/summary (Resumo de produtos para Dashboard - Protegida para ADMIN ou EDITOR_ADMIN)
// CORREÇÃO: Usando verificarEditorAdmin para permitir ADMIN e EDITOR_ADMIN ver o resumo
router.get("/summary", verificarToken, verificarEditorAdmin, async (req: Request, res: Response) => {
    try {
        const totalProducts = await prisma.product.count();

        const productsByCategory = await prisma.product.groupBy({
            by: ['category'],
            _count: {
                id: true,
            },
            _sum: {
                stock: true,
            },
            orderBy: {
                _count: {
                    id: 'desc',
                },
            },
        });

        const totalStockResult = await prisma.product.aggregate({
            _sum: {
                stock: true,
            },
        });

        res.status(200).json({
            totalProducts: totalProducts,
            productsByCategory: productsByCategory.map(item => ({
                category: item.category || 'Sem Categoria',
                count: item._count.id,
                totalStock: item._sum.stock || 0,
            })),
            totalStock: totalStockResult._sum.stock || 0,
        });

    } catch (error) {
        console.error("Erro ao buscar resumo de produtos para dashboard:", error);
        res.status(500).json({ error: "Erro ao buscar resumo de produtos" });
    }
});


// Rota: GET /products/:id (Buscar produto por ID - Pública)
router.get("/:id", async (req: Request, res: Response) => {
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

// Rota: POST /products (Criar novo produto - Protegida para ADMIN ou EDITOR_ADMIN)
// CORREÇÃO: Usando verificarEditorAdmin para permitir ADMIN e EDITOR_ADMIN criarem produtos
router.post("/", verificarToken, verificarEditorAdmin, async (req: Request, res: Response) => {
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

// Rota: PUT /products/:id (Atualizar produto - Protegida para ADMIN ou EDITOR_ADMIN)
// CORREÇÃO: Usando verificarEditorAdmin para permitir ADMIN e EDITOR_ADMIN atualizarem produtos
router.put("/:id", verificarToken, verificarEditorAdmin, async (req: Request, res: Response) => {
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

// Rota: DELETE /products/:id (Deletar produto - APENAS FULL ADMIN)
// CORREÇÃO: Usando verificarFullAdmin para manter apenas ADMIN completo para deletar
router.delete("/:id", verificarToken, verificarFullAdmin, async (req: Request, res: Response) => {
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

export default router;