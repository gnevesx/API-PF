"use client"
import { useEffect, useState, useCallback } from "react";
import { toast } from 'sonner';
import { useGlobalStore } from "@/context/GlobalStore"; // Alias de importação
import { ProductItf } from "@/utils/types/ProductItf"; // Alias de importação
import Link from "next/link";
import Image from "next/image"; // Importando o componente Image do Next.js para otimização

// --- CORREÇÃO: REMOVIDA A INTERFACE CartItemGlobal DUPLICADA E NÃO UTILIZADA QUE ESTAVA AQUI ---

// Tipagem dos Itens do Carrinho (compatível com a API)
interface CartItemItf {
    id: string;
    quantity: number;
    productId: string;
    cartId: string;
    product: ProductItf;
}

// Tipagem da resposta da API do carrinho
interface CartApiResponse {
    cartItems: CartItemItf[];
}

export default function CartPage() {
    const { user, setCartItems: setGlobalCartItems, removeFromCartLocal, updateCartItemQuantityLocal, clearCart } = useGlobalStore();
    const [cartItems, setCartItems] = useState<CartItemItf[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalPrice, setTotalPrice] = useState(0);

    const fetchCartItems = useCallback(async () => {
        if (!user.token) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/cart`, {
                headers: {
                    "Authorization": `Bearer ${user.token}`,
                },
            });

            if (response.ok) {
                const data: CartApiResponse = await response.json();
                const items = data.cartItems || [];
                setCartItems(items);
                setGlobalCartItems(items.map(item => ({ productId: item.productId, quantity: item.quantity })));
            } else {
                toast.error("Erro ao carregar o carrinho.");
                setCartItems([]);
                setGlobalCartItems([]);
            }
        } catch (error) { // Usando 'error' como tipo 'any' ou 'unknown' é permitido
            console.error("Erro ao buscar itens do carrinho:", error);
            toast.error("Erro de conexão ao carregar o carrinho. Verifique sua API.");
            setCartItems([]);
            setGlobalCartItems([]);
        } finally {
            setLoading(false);
        }
    }, [user.token, setGlobalCartItems]);

    useEffect(() => {
        fetchCartItems();
    }, [fetchCartItems]);

    useEffect(() => {
        const total = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
        setTotalPrice(total);
    }, [cartItems]);

    const handleUpdateQuantity = async (cartItemId: string, newQuantity: number) => {
        if (!user.token) {
            toast.error("Erro de autenticação. Faça login novamente.");
            return;
        }
        if (newQuantity <= 0) {
            handleRemoveItem(cartItemId);
            return;
        }

        const itemToUpdate = cartItems.find(item => item.id === cartItemId);
        if (itemToUpdate && newQuantity > itemToUpdate.product.stock) {
            toast.error(`Estoque insuficiente para ${itemToUpdate.product.name}. Disponível: ${itemToUpdate.product.stock}`);
            return;
        }

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/cart/update/${cartItemId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${user.token}`,
                },
                body: JSON.stringify({ quantity: newQuantity }),
            });

            if (response.ok) {
                toast.success("Quantidade atualizada!");
                setCartItems(prevItems => prevItems.map(item => item.id === cartItemId ? { ...item, quantity: newQuantity } : item));
                if (itemToUpdate) {
                    updateCartItemQuantityLocal(itemToUpdate.productId, newQuantity);
                }
            } else {
                const errorData = await response.json();
                toast.error(errorData.message || "Erro ao atualizar quantidade.");
            }
        } catch (error) {
            console.error("Erro ao atualizar quantidade do carrinho:", error);
            toast.error("Erro de conexão ao atualizar carrinho.");
        }
    };

    const handleRemoveItem = async (cartItemId: string) => {
        if (!user.token) {
            toast.error("Erro de autenticação. Faça login novamente.");
            return;
        }
        
        if (!window.confirm("Tem certeza que deseja remover este item do carrinho?")) {
            return;
        }

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/cart/remove/${cartItemId}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${user.token}`,
                },
            });

            if (response.ok) {
                toast.success("Item removido do carrinho!");
                const removedItem = cartItems.find(item => item.id === cartItemId);
                if (removedItem) {
                    removeFromCartLocal(removedItem.productId);
                }
                setCartItems(prevItems => prevItems.filter(item => item.id !== cartItemId));
            } else {
                const errorData = await response.json();
                toast.error(errorData.message || "Erro ao remover item.");
            }
        } catch (error) {
            console.error("Erro ao remover item do carrinho:", error);
            toast.error("Erro de conexão ao remover item.");
        }
    };

    const handleCheckout = async () => {
        if (!user.token) {
            toast.error("Você precisa estar logado para finalizar a compra.");
            return;
        }

        if (cartItems.length === 0) {
            toast.info("Seu carrinho está vazio.");
            return;
        }
        
        if (!window.confirm("Confirma a finalização da compra?")) {
            return;
        }

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/cart/checkout`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${user.token}`,
                },
            });

            if (response.ok) {
                toast.success("Compra finalizada com sucesso! Seu carrinho foi esvaziado.");
                setCartItems([]);
                clearCart();
            } else {
                const errorData = await response.json();
                toast.error(errorData.message || "Erro ao finalizar a compra.");
            }
        } catch (error) {
            console.error("Erro na requisição de checkout:", error);
            toast.error("Erro de conexão ao finalizar a compra. Tente novamente mais tarde.");
        }
    };


    if (!user.id) {
        return (
            <section className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-8 px-4">
                <div className="text-center text-xl text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl max-w-md">
                    <p>Por favor, <Link href="/login" className="text-gray-600 hover:underline dark:text-gray-400">faça login</Link> para ver seu carrinho.</p>
                </div>
            </section>
        );
    }

    if (loading) {
        return (
             <section className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-8 px-4">
                <div className="text-center text-xl text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl max-w-md">
                    Carregando carrinho...
                </div>
            </section>
        );
    }

    if (cartItems.length === 0) {
        return (
            <section className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-8 px-4">
                <div className="text-center text-xl text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl max-w-md">
                    <p>Seu carrinho está vazio. <Link href="/" className="text-gray-600 hover:underline dark:text-gray-400">Continue comprando!</Link></p>
                </div>
            </section>
        );
    }

    return (
        <section className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto p-4 md:p-8 bg-white dark:bg-gray-800 rounded-xl shadow-2xl space-y-8">
                <h1 className="text-3xl md:text-4xl font-extrabold text-center text-gray-900 dark:text-white">
                    🛒 Seu <span className="text-gray-700 dark:text-gray-400">Carrinho de Compras</span>
                </h1>

                {cartItems.map((item) => (
                    <div
                        key={item.id}
                        className="flex flex-col md:flex-row items-center gap-4 bg-gray-100 dark:bg-gray-900 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
                    >
                        <Image // Usando o componente Image do Next.js
                            src={item.product.imageUrl || "/placeholder-image.png"}
                            alt={item.product.name}
                            width={96} // Ajuste conforme necessário
                            height={96} // Ajuste conforme necessário
                            className="w-24 h-24 object-cover rounded-md flex-shrink-0"
                        />

                        <div className="flex-1 space-y-1 text-center md:text-left">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {item.product.name}
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Preço Unitário: <strong className="font-medium text-gray-700 dark:text-gray-300">R$ {item.product.price.toLocaleString("pt-br", { minimumFractionDigits: 2 })}</strong>
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Total: <strong className="font-medium text-gray-700 dark:text-gray-300">R$ {(item.product.price * item.quantity).toLocaleString("pt-br", { minimumFractionDigits: 2 })}</strong>
                            </p>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0 mt-4 md:mt-0">
                            <button
                                onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                className="bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-1 rounded hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
                            >
                                −
                            </button>
                            <input
                                type="number"
                                min="0"
                                max={item.product.stock}
                                value={item.quantity}
                                onChange={(e) => handleUpdateQuantity(item.id, parseInt(e.target.value))}
                                className="w-16 text-center border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:ring-gray-500 focus:border-gray-500 transition-colors"
                            />
                            <button
                                onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                className="bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-1 rounded hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
                            >
                                +
                            </button>
                        </div>

                        <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-red-500 hover:text-red-600 dark:hover:text-red-400 ml-0 md:ml-4 flex-shrink-0 mt-4 md:mt-0 transition-colors"
                            title="Remover item"
                        >
                            🗑️
                        </button>
                    </div>
                ))}

                <div className="flex flex-col sm:flex-row justify-between items-center mt-8 border-t border-gray-200 dark:border-gray-700 pt-6 gap-4">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        Total: <span className="text-gray-700 dark:text-gray-400">R$ {totalPrice.toLocaleString("pt-br", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <button
                        onClick={handleCheckout}
                        className="bg-gray-700 hover:bg-gray-800 text-white text-lg font-semibold py-3 px-6 rounded-lg transition-colors focus:ring-4 focus:outline-none focus:ring-gray-500 dark:bg-gray-700 dark:hover:bg-gray-800 dark:focus:ring-gray-600"
                    >
                        Finalizar Compra
                    </button>
                </div>
            </div>
        </section>
    );
}