"use client"
import { ProductItf } from "@/utils/types/ProductItf";
import Link from "next/link";
import { toast } from 'sonner';
import { useGlobalStore } from "@/context/GlobalStore";
import Image from "next/image"; // Importando o componente Image do Next.js

export function ProductCard({ data }: { data: ProductItf }) {
    const { user, addToCartLocal } = useGlobalStore();

    async function handleAddToCart() {
        if (!user.id) {
            toast.info("Você precisa estar logado para adicionar itens ao carrinho.");
            return;
        }
        if (!user.token) {
            toast.error("Erro de autenticação. Por favor, faça login novamente.");
            return;
        }
        if (data.stock <= 0) {
            toast.error("Produto esgotado!");
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
                    productId: data.id,
                    quantity: 1
                })
            });

            if (response.ok) {
                toast.success(`${data.name} adicionado ao carrinho!`);
                addToCartLocal(data.id, 1);
            } else {
                const errorData = await response.json();
                toast.error(errorData.message || "Erro ao adicionar produto ao carrinho.");
            }
        } catch (error) {
            console.error("Erro na requisição de adicionar ao carrinho:", error);
            toast.error("Erro ao adicionar produto ao carrinho. Tente novamente mais tarde.");
        }
    }

    async function handleDeleteProduct() {
        if (!user.id || user.role !== "ADMIN" || !user.token) {
            toast.error("Você não tem permissão para deletar produtos.");
            return;
        }

        if (!confirm(`Tem certeza que deseja deletar o produto "${data.name}"?`)) {
            return;
        }

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/products/${data.id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${user.token}` 
                }
            });

            if (response.ok) {
                toast.success(`Produto "${data.name}" deletado com sucesso!`);
                // *** CORREÇÃO AQUI: LINHA window.location.reload() REMOVIDA! ***
                // Em vez de recarregar, podemos adicionar uma mensagem ou atualizar o estado do pai
                toast.info("O produto foi deletado. Por favor, recarregue a página para ver a lista atualizada."); 
            } else {
                const errorData = await response.json();
                toast.error(errorData.message || "Erro ao deletar produto.");
            }
        } catch (error) {
            console.error("Erro na requisição de deletar produto:", error);
            toast.error("Erro ao deletar produto. Tente novamente mais tarde.");
        }
    }

    return (
        // Card principal com bordas mais arredondadas e sombra marcante
        <div className="bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105 dark:bg-gray-800 dark:border-gray-700 flex flex-col h-full">
            {/* Imagem com bordas arredondadas no topo */}
            <Image // Usando o componente Image do Next.js
                className="w-full h-48 object-cover object-center rounded-t-xl"
                src={data.imageUrl || "/placeholder-image.png"}
                alt={data.name}
                width={300} // Largura base para otimização
                height={200} // Altura base para otimização
                priority={false} // Defina como true se for uma imagem de destaque na primeira dobra
            />
            <div className="p-5 flex flex-col flex-grow"> {/* Aumentei o padding interno */}
                <h5 className="text-xl font-bold text-gray-900 dark:text-white mb-2 leading-tight"> {/* Título mais negrito */}
                    {data.name}
                </h5>
                {/* Informações detalhadas com cores ajustadas e espaçamento */}
                <p className="text-gray-700 dark:text-gray-300 text-sm mb-1">
                    <span className="font-semibold">Categoria:</span> {data.category || 'N/A'}
                </p>
                <p className="text-gray-700 dark:text-gray-300 text-sm mb-1">
                    <span className="font-semibold">Tamanho:</span> {data.size || 'N/A'} - <span className="font-semibold">Cor:</span> {data.color || 'N/A'}
                </p>
                <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">
                    <span className="font-semibold">Estoque:</span> {data.stock}
                </p>
                {/* Preço maior e em cinza */}
                <p className="text-3xl font-extrabold text-gray-700 dark:text-gray-400 mb-4">
                    R$ {Number(data.price).toLocaleString("pt-br", {
                        minimumFractionDigits: 2
                    })}
                </p>
                <div className="mt-auto flex flex-col gap-3"> {/* Aumentei o espaçamento entre os botões */}
                    {/* Botão Descrição com estilo cinza vibrante */}
                    <Link href={`/products/${data.id}`} className="inline-flex items-center justify-center px-4 py-2.5 text-base font-medium text-center text-white bg-gray-600 rounded-lg hover:bg-gray-700 focus:ring-4 focus:outline-none focus:ring-gray-300 dark:bg-gray-700 dark:hover:bg-gray-800 transition-colors duration-200">
                        Descrição
                        <svg className="rtl:rotate-180 w-4 h-4 ms-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 5h12m0 0L9 1m4 4L9 9" />
                        </svg>
                    </Link>
                    {/* Botão Adicionar ao Carrinho com estilo cinza, desabilitado em cinza mais claro */}
                    <button
                        onClick={handleAddToCart}
                        disabled={data.stock <= 0 || !user.id}
                        className={`inline-flex items-center justify-center px-4 py-2.5 text-base font-medium text-center text-white rounded-lg focus:ring-4 focus:outline-none transition-colors duration-200 ${
                            data.stock <= 0 || !user.id
                                ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' // Cores para desabilitado
                                : 'bg-gray-700 hover:bg-gray-800 focus:ring-gray-300 dark:bg-gray-700 dark:hover:bg-gray-800 dark:focus:ring-800' // Cores para habilitado
                        }`}
                    >
                        Adicionar ao Carrinho
                        <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                    </button>
                    {/* Botão Remover Produto (ADMIN) em vermelho */}
                    {user.role === "ADMIN" && (
                        <button
                            onClick={handleDeleteProduct}
                            className="inline-flex items-center justify-center px-4 py-2.5 text-base font-medium text-center text-white bg-red-600 rounded-lg hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300 transition-colors duration-200"
                        >
                            Remover Produto
                            <svg className="w-4 h-4 ml-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}