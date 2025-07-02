"use client"
import { ProductItf } from "@/utils/types/ProductItf";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from 'sonner';
import { useGlobalStore } from "@/context/GlobalStore";
import Link from "next/link"; // Certifique-se que este import existe
import Image from "next/image"; // Importando o componente Image do Next.js

// --- Tipagem para a resposta de erro da API ---
type ApiError = {
    message: string;
}

export default function ProductDetails() {
    const params = useParams();
    const productId = params.product_id as string;

    const [product, setProduct] = useState<ProductItf | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [quantityToAdd, setQuantityToAdd] = useState(1);

    const { user, addToCartLocal } = useGlobalStore();

    useEffect(() => {
        async function fetchProductDetails() {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/products/${productId}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data: ProductItf = await response.json();
                setProduct(data);
                if (data.stock > 0) {
                    setQuantityToAdd(1);
                } else {
                    setQuantityToAdd(0);
                }
            } catch (err: unknown) { // Usando 'unknown' em vez de 'any' para o erro
                console.error("Erro ao buscar detalhes do produto:", err);
                setError("Não foi possível carregar os detalhes do produto.");
            } finally {
                setLoading(false);
            }
        }
        if (productId) {
            fetchProductDetails();
        }
    }, [productId]);

    async function handleAddToCart() {
        if (!user.id) {
            toast.info("Você precisa estar logado para adicionar itens ao carrinho.");
            return;
        }
        if (!user.token) {
            toast.error("Erro de autenticação. Por favor, faça login novamente.");
            return;
        }
        if (!product || product.stock <= 0) {
            toast.error("Produto esgotado ou não disponível!");
            return;
        }
        if (quantityToAdd <= 0) {
            toast.error("A quantidade deve ser pelo menos 1.");
            return;
        }
        if (product.stock < quantityToAdd) {
            toast.error(`Estoque insuficiente. Disponível: ${product.stock}`);
            return;
        }

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/cart/add`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${user.token}`
                },
                body: JSON.stringify({
                    productId: product.id,
                    quantity: quantityToAdd
                })
            });

            if (response.ok) {
                toast.success(`${quantityToAdd}x ${product.name} adicionado(s) ao carrinho!`);
                addToCartLocal(product.id, quantityToAdd);
                setProduct(prev => prev ? { ...prev, stock: prev.stock - quantityToAdd } : null);
            } else {
                const errorData: ApiError = await response.json();
                toast.error(errorData.message || "Erro ao adicionar produto ao carrinho.");
            }
        } catch (error) {
            console.error("Erro na requisição de adicionar ao carrinho:", error);
            toast.error("Erro ao adicionar produto ao carrinho. Tente novamente mais tarde.");
        }
    }

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center text-center text-xl text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900">Carregando detalhes do produto...</div>;
    }

    if (error) {
        return <div className="min-h-screen flex items-center justify-center text-center text-xl text-red-500 bg-gray-50 dark:bg-gray-900">{error}</div>;
    }

    if (!product) {
        return <div className="min-h-screen flex items-center justify-center text-center text-xl text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900">Produto não encontrado.</div>;
    }

    return (
        <section className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
            <div className="max-w-6xl w-full mx-auto p-8 bg-white rounded-2xl shadow-2xl dark:bg-gray-800 flex flex-col md:flex-row gap-10">
                <div className="md:w-1/2 flex-shrink-0">
                    {/* CORREÇÃO: Usando o componente Image do Next.js para otimização */}
                    <Image
                        className="w-full h-auto object-cover rounded-xl shadow-lg transform hover:scale-105 transition-transform duration-300"
                        src={product.imageUrl || "/placeholder-image.png"}
                        alt={product.name}
                        width={600} // Ajuste conforme necessário
                        height={600} // Ajuste conforme necessário
                        priority // Opcional: Prioriza o carregamento da imagem principal da página
                    />
                </div>
                <div className="md:w-1/2 flex flex-col justify-between">
                    <div>
                        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-4 leading-tight">
                            {product.name}
                        </h1>
                        <p className="text-lg text-gray-700 dark:text-gray-300 mb-6 border-b border-gray-200 dark:border-gray-700 pb-6">
                            {product.description || "Nenhuma descrição disponível."}
                        </p>
                        <div className="text-gray-600 dark:text-gray-400 text-base space-y-2">
                            <p><strong className="font-semibold text-gray-800 dark:text-gray-200">Categoria:</strong> {product.category || 'N/A'}</p>
                            <p><strong className="font-semibold text-gray-800 dark:text-gray-200">Tamanho:</strong> {product.size || 'N/A'}</p>
                            <p><strong className="font-semibold text-gray-800 dark:text-gray-200">Cor:</strong> {product.color || 'N/A'}</p>
                            <p><strong className="font-semibold text-gray-800 dark:text-gray-200">Estoque:</strong> {product.stock}</p>
                        </div>
                    </div>
                    <div className="mt-8">
                        <h2 className="text-4xl font-bold text-gray-700 dark:text-gray-400 mb-6">
                            R$ {Number(product.price).toLocaleString("pt-br", { minimumFractionDigits: 2 })}
                        </h2>

                        {user.id ? (
                            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 mt-4">
                                <label htmlFor="quantityInput" className="text-lg font-medium text-gray-900 dark:text-white">Quantidade:</label>
                                <input
                                    type="number"
                                    id="quantityInput"
                                    min="1"
                                    max={product.stock > 0 ? product.stock : 1}
                                    value={quantityToAdd}
                                    onChange={(e) => {
                                        const value = parseInt(e.target.value, 10);
                                        if (isNaN(value)) setQuantityToAdd(1);
                                        else if (value > product.stock) setQuantityToAdd(product.stock);
                                        else if (value < 1) setQuantityToAdd(1);
                                        else setQuantityToAdd(value);
                                    }}
                                    className="w-full sm:w-28 p-3 border border-gray-300 rounded-lg text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white focus:ring-gray-500 focus:border-gray-500 transition-colors"
                                />
                                <button
                                    onClick={handleAddToCart}
                                    disabled={product.stock <= 0 || quantityToAdd <= 0}
                                    className={`inline-flex items-center justify-center w-full sm:w-auto px-8 py-3 text-lg font-semibold text-center text-white rounded-lg focus:ring-4 focus:outline-none transition-all duration-300 transform hover:-translate-y-0.5 ${product.stock <= 0 || quantityToAdd <= 0
                                        ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                                        : 'bg-gray-700 hover:bg-gray-800 focus:ring-gray-300 dark:bg-gray-700 dark:hover:bg-gray-800 dark:focus:ring-gray-800'
                                    }`}
                                >
                                    Adicionar ao Carrinho
                                    <svg className="w-6 h-6 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                                </button>
                            </div>
                        ) : (
                            <h2 className="text-xl text-gray-900 dark:text-white mt-6">
                                {/* CORREÇÃO: Usando <Link /> do Next.js */}
                                <Link href="/login" className="text-gray-700 hover:underline dark:text-gray-400">Faça login</Link> para adicionar ao carrinho!
                            </h2>
                        )}
                        {/* CORREÇÃO: Usando <Link /> do Next.js */}
                        <Link href="/" className="mt-8 inline-block text-gray-700 hover:underline dark:text-gray-400 text-lg font-medium">
                            &larr; Voltar para a Loja
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}