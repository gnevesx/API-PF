// routes/cart.ts

import { Role } from '@prisma/client';
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma/client.js';

// Importando os middlewares centralizados (CORREÇÃO AQUI)
import { verificarToken } from '../middlewares/auth.js';
// CORREÇÃO: Importa os novos middlewares verificarFullAdmin e verificarEditorAdmin
import { verificarFullAdmin, verificarEditorAdmin } from '../middlewares/adminAuth.js';

const router = Router();

// --- ZOD SCHEMAS ---
const addToCartSchema = z.object({
  productId: z.string().uuid({ message: "ID do produto inválido" }),
  quantity: z.number().int().min(1, { message: "Quantidade deve ser pelo menos 1" }),
});

const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1, { message: "Quantidade deve ser pelo menos 1" }),
});

// --- ROTAS ---

// Rota: GET /cart (Obter o carrinho do usuário autenticado)
router.get("/", verificarToken, async (req: Request, res: Response) => {
  // O ID do usuário vem do token, garantindo que ele só possa ver o próprio carrinho.
  const userId = req.usuario?.id;

  if (!userId) {
    return res.status(401).json({ message: "Usuário não autenticado." });
  }

  try {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        cartItems: {
          include: {
            product: {
              select: { id: true, name: true, price: true, imageUrl: true, stock: true }
            }
          }
        }
      }
    });

    if (!cart) {
      // Se não houver carrinho, retorna um carrinho vazio para consistência no frontend.
      return res.status(200).json({ userId, cartItems: [] });
    }

    res.status(200).json(cart);
  } catch (error) {
    console.error("Erro ao buscar carrinho:", error);
    res.status(500).json({ error: "Erro ao buscar carrinho" });
  }
});

// Rota: POST /cart/add (Adicionar item ao carrinho do usuário autenticado)
router.post("/add", verificarToken, async (req: Request, res: Response) => {
  if (!req.usuario) {
    return res.status(401).json({ message: "Usuário não autenticado." });
  }

  const validation = addToCartSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ errors: validation.error.issues });
  }

  const { productId, quantity } = validation.data;
  const userId = req.usuario.id;

  try {
    const product = await prisma.product.findUnique({ where: { id: productId } });

    if (!product) {
      return res.status(404).json({ message: "Produto não encontrado" });
    }
    if (product.stock < quantity) {
      return res.status(400).json({ message: `Estoque insuficiente para ${product.name}. Disponível: ${product.stock}` });
    }

    // Encontra ou cria o carrinho para o usuário
    const cart = await prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    const existingCartItem = await prisma.cartItem.findFirst({
      where: { cartId: cart.id, productId }
    });

    let cartItem;
    if (existingCartItem) {
      // Se o item já existe, atualiza a quantidade
      cartItem = await prisma.cartItem.update({
        where: { id: existingCartItem.id },
        data: { quantity: existingCartItem.quantity + quantity }
      });
    } else {
      // Se o item não existe, cria um novo
      cartItem = await prisma.cartItem.create({
        data: { cartId: cart.id, productId, quantity }
      });
    }

    res.status(200).json({ message: "Item adicionado ao carrinho", cartItem });
  } catch (error) {
    console.error("Erro ao adicionar item ao carrinho:", error);
    res.status(500).json({ error: "Erro ao adicionar item ao carrinho" });
  }
});

// Rota: PUT /cart/update/:cartItemId (Atualizar quantidade de um item)
router.put("/update/:cartItemId", verificarToken, async (req: Request, res: Response) => {
  if (!req.usuario) {
    return res.status(401).json({ message: "Usuário não autenticado." });
  }

  const { cartItemId } = req.params;
  const validation = updateCartItemSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ errors: validation.error.issues });
  }

  const { quantity } = validation.data;
  const { id: userId, role: userRole } = req.usuario;

  try {
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: { cart: true, product: true }
    });

    if (!cartItem) {
      return res.status(404).json({ message: "Item do carrinho não encontrado" });
    }
    if (cartItem.cart.userId !== userId && userRole !== Role.ADMIN) {
      return res.status(403).json({ message: "Acesso negado." });
    }
    if (cartItem.product.stock < quantity) {
      return res.status(400).json({ message: `Estoque insuficiente para ${cartItem.product.name}. Disponível: ${cartItem.product.stock}` });
    }

    const updatedCartItem = await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity }
    });

    res.status(200).json({ message: "Quantidade do item atualizada", updatedCartItem });
  } catch (error) {
    console.error("Erro ao atualizar item do carrinho:", error);
    res.status(500).json({ error: "Erro ao atualizar item do carrinho" });
  }
});

// Rota: DELETE /cart/remove/:cartItemId (Remover item do carrinho)
router.delete("/remove/:cartItemId", verificarToken, async (req: Request, res: Response) => {
  if (!req.usuario) {
    return res.status(401).json({ message: "Usuário não autenticado." });
  }

  const { cartItemId } = req.params;
  const { id: userId, role: userRole } = req.usuario;

  try {
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: { cart: true }
    });

    if (!cartItem) {
      return res.status(404).json({ message: "Item do carrinho não encontrado" });
    }
    if (cartItem.cart.userId !== userId && userRole !== Role.ADMIN) {
      return res.status(403).json({ message: "Acesso negado." });
    }

    await prisma.cartItem.delete({ where: { id: cartItemId } });

    res.status(200).json({ message: "Item removido do carrinho" });
  } catch (error) {
    console.error("Erro ao remover item do carrinho:", error);
    res.status(500).json({ error: "Erro ao remover item do carrinho" });
  }
});

// Rota: POST /cart/checkout (Finalizar Compra e esvaziar o carrinho)
router.post("/checkout", verificarToken, async (req: Request, res: Response) => {
    if (!req.usuario) {
        return res.status(401).json({ message: "Usuário não autenticado." });
    }
    const userId = req.usuario.id;

    try {
        const cart = await prisma.cart.findUnique({ where: { userId } });

        if (!cart) {
            return res.status(404).json({ message: "Carrinho não encontrado." });
        }

        await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

        res.status(200).json({ message: "Compra finalizada com sucesso! Carrinho esvaziado." });

    } catch (error) {
        console.error("Erro ao finalizar a compra:", error);
        res.status(500).json({ error: "Erro ao finalizar a compra." });
    }
});

// ====================================================================
// NOVAS ROTAS PARA DASHBOARD ADMIN - GERENCIAMENTO DE CARRINHOS DE CLIENTES
// ====================================================================

// Rota: GET /cart/admin/all (Listar TODOS os carrinhos - Protegida para ADMIN ou EDITOR_ADMIN)
// CORREÇÃO: Usando verificarEditorAdmin para permitir ADMIN e EDITOR_ADMIN listarem carrinhos
router.get("/admin/all", verificarToken, verificarEditorAdmin, async (req: Request, res: Response) => {
  try {
    const allCarts = await prisma.cart.findMany({
      include: {
        user: { // Inclui informações básicas do usuário dono do carrinho
          select: { id: true, name: true, email: true }
        },
        cartItems: {
          include: {
            product: {
              select: { id: true, name: true, price: true, imageUrl: true }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc' // Ordena pelos carrinhos mais recentes
      }
    });

    const activeCarts = allCarts.filter(cart => cart.cartItems.length > 0);

    res.status(200).json(activeCarts);
  } catch (error) {
    console.error("Erro ao buscar todos os carrinhos para admin:", error);
    res.status(500).json({ error: "Erro ao buscar todos os carrinhos" });
  }
});

// Rota: DELETE /cart/admin/clear/:userId (Excluir/Esvaziar o carrinho de um usuário específico - APENAS FULL ADMIN)
// CORREÇÃO: Usando verificarFullAdmin para manter apenas ADMIN completo para esvaziar carrinho
router.delete("/admin/clear/:userId", verificarToken, verificarFullAdmin, async (req: Request, res: Response) => {
  const { userId } = req.params; // ID do usuário cujo carrinho será esvaziado

  try {
    const cart = await prisma.cart.findUnique({
      where: { userId }
    });

    if (!cart) {
      return res.status(404).json({ message: "Carrinho do usuário não encontrado." });
    }

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id }
    });

    res.status(200).json({ message: `Carrinho do usuário ${userId} esvaziado com sucesso.` });
  } catch (error) {
    console.error(`Erro ao esvaziar carrinho do usuário ${userId}:`, error);
    res.status(500).json({ error: "Erro ao esvaziar carrinho do usuário" });
  }
});


export default router;