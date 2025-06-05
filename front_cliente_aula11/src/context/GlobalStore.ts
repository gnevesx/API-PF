// FRONT_CLIENTE_AULA11/context/GlobalStore.ts
import { UserItf } from '@/utils/types/UserItf';
import { create } from 'zustand';

// Interface para um item do carrinho simplificado (apenas o que precisamos para o contador)
interface CartItemGlobal {
  productId: string;
  quantity: number;
}

// Definição do estado global
type GlobalStore = {
  user: UserItf;
  cartItems: CartItemGlobal[]; // Adiciona o estado do carrinho
  
  loginUser: (userLoggedIn: UserItf) => void;
  logoutUser: () => void;
  
  // Ações para o carrinho
  setCartItems: (items: CartItemGlobal[]) => void;
  clearCart: () => void; // Para quando finalizar a compra ou deslogar
  addToCartLocal: (productId: string, quantity: number) => void; // Adiciona localmente (para contador)
  removeFromCartLocal: (productId: string) => void; // Remove localmente (para contador)
  updateCartItemQuantityLocal: (productId: string, newQuantity: number) => void; // Atualiza localmente
};

export const useGlobalStore = create<GlobalStore>((set, get) => ({
  user: {} as UserItf,
  cartItems: [], // Inicializa o carrinho como vazio
  
  loginUser: (userLoggedIn) => set({ user: userLoggedIn }),
  logoutUser: () => set({ user: {} as UserItf, cartItems: [] }), // Limpa o carrinho ao deslogar
  
  setCartItems: (items) => set({ cartItems: items }),
  clearCart: () => set({ cartItems: [] }),

  addToCartLocal: (productId, quantity) => {
    set((state) => {
      const existingItem = state.cartItems.find(item => item.productId === productId);
      if (existingItem) {
        return {
          cartItems: state.cartItems.map(item =>
            item.productId === productId ? { ...item, quantity: item.quantity + quantity } : item
          ),
        };
      } else {
        return {
          cartItems: [...state.cartItems, { productId, quantity }],
        };
      }
    });
  },

  removeFromCartLocal: (productId) => {
    set((state) => ({
      cartItems: state.cartItems.filter(item => item.productId !== productId),
    }));
  },

  updateCartItemQuantityLocal: (productId, newQuantity) => {
    set((state) => ({
      cartItems: state.cartItems.map(item =>
        item.productId === productId ? { ...item, quantity: newQuantity } : item
      ),
    }));
  },
}));