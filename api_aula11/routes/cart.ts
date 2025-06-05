import { Role } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import jwt from "jsonwebtoken";
import prisma from '../prisma/client.js'; // <-- Importação do cliente Prisma centralizado

const router = Router();

// Middleware de autenticação (copiado para consistência, mas idealmente centralizado)
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

const addToCartSchema = z.object({
  productId: z.string().uuid({ message: "ID do produto inválido" }),
  quantity: z.number().int().min(1, { message: "Quantidade deve ser pelo menos 1" }),
});

const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1, { message: "Quantidade deve ser pelo menos 1" }),
});

// Rota: GET /cart/:userId (Obter o carrinho de um usuário)
// O próprio usuário ou um ADMIN pode ver o carrinho
router.get("/:userId", verifyToken, async (req: any, res) => {
  const { userId } = req.params;

  if (req.userRole !== Role.ADMIN && req.userId !== userId) {
    return res.status(403).json({ message: "Acesso negado: Você só pode visualizar seu próprio carrinho." });
  }

  try {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        cartItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                imageUrl: true,
                stock: true,
              }
            }
          }
        }
      }
    });

    if (!cart) {
      // Se não houver carrinho, retorna um carrinho vazio
      return res.status(200).json({ userId, cartItems: [] });
    }

    res.status(200).json(cart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar carrinho" });
  }
});

// Rota: POST /cart/add (Adicionar item ao carrinho)
router.post("/add", verifyToken, async (req: any, res) => {
  const validation = addToCartSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ errors: validation.error.issues });
  }

  const { productId, quantity } = validation.data;
  const userId = req.userId; // Obtido do token de autenticação

  try {
    // Verifica se o produto existe e tem estoque suficiente
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return res.status(404).json({ message: "Produto não encontrado" });
    }
    if (product.stock < quantity) {
      return res.status(400).json({ message: `Estoque insuficiente para ${product.name}. Disponível: ${product.stock}` });
    }

    let cart = await prisma.cart.findUnique({
      where: { userId }
    });

    // Se o carrinho não existir para o usuário, cria um novo
    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId }
      });
    }

    // Procura por um item existente no carrinho para o produto
    const existingCartItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId,
      }
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
        data: {
          cartId: cart.id,
          productId,
          quantity,
        }
      });
    }

    res.status(200).json({ message: "Item adicionado ao carrinho", cartItem });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao adicionar item ao carrinho" });
  }
});

// Rota: PUT /cart/update/:cartItemId (Atualizar quantidade de item no carrinho)
router.put("/update/:cartItemId", verifyToken, async (req: any, res) => {
  const { cartItemId } = req.params;
  const validation = updateCartItemSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ errors: validation.error.issues });
  }

  const { quantity } = validation.data;
  const userId = req.userId;

  try {
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: { cart: true, product: true }
    });

    if (!cartItem) {
      return res.status(404).json({ message: "Item do carrinho não encontrado" });
    }
    if (cartItem.cart.userId !== userId && req.userRole !== Role.ADMIN) {
      return res.status(403).json({ message: "Acesso negado: Você não tem permissão para alterar este item do carrinho." });
    }

    // Verifica estoque
    if (cartItem.product.stock < quantity) {
      return res.status(400).json({ message: `Estoque insuficiente para ${cartItem.product.name}. Disponível: ${cartItem.product.stock}` });
    }

    const updatedCartItem = await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity }
    });

    res.status(200).json({ message: "Quantidade do item atualizada", updatedCartItem });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao atualizar quantidade do item no carrinho" });
  }
});

// Rota: DELETE /cart/remove/:cartItemId (Remover item do carrinho)
router.delete("/remove/:cartItemId", verifyToken, async (req: any, res) => {
  const { cartItemId } = req.params;
  const userId = req.userId;

  try {
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: { cart: true }
    });

    if (!cartItem) {
      return res.status(404).json({ message: "Item do carrinho não encontrado" });
    }
    if (cartItem.cart.userId !== userId && req.userRole !== Role.ADMIN) {
      return res.status(403).json({ message: "Acesso negado: Você não tem permissão para remover este item do carrinho." });
    }

    await prisma.cartItem.delete({
      where: { id: cartItemId }
    });

    res.status(200).json({ message: "Item removido do carrinho" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao remover item do carrinho" });
  }
});

// NOVA ROTA: POST /cart/checkout (Finalizar Compra)
router.post("/checkout", verifyToken, async (req: any, res) => {
    const userId = req.userId; // Obtido do token de autenticação

    try {
        // Busca o carrinho do usuário
        const cart = await prisma.cart.findUnique({
            where: { userId }
        });

        if (!cart) {
            return res.status(404).json({ message: "Carrinho não encontrado para este usuário." });
        }

        // Deleta todos os itens associados a este carrinho
        await prisma.cartItem.deleteMany({
            where: { cartId: cart.id }
        });

        // Opcional: Você pode também deletar o carrinho se ele não tiver mais itens.
        // No entanto, é comum manter o carrinho vazio para o próximo uso.
        // await prisma.cart.delete({
        //     where: { id: cart.id }
        // });

        res.status(200).json({ message: "Compra finalizada com sucesso! Carrinho esvaziado." });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao finalizar a compra." });
    }
});


export default router;