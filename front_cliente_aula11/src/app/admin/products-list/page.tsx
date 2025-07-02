"use client";

import { useEffect, useState, useCallback } from "react";
import { ProductItf } from "@/utils/types/ProductItf";
import { useGlobalStore } from "@/context/GlobalStore";
import { toast } from 'sonner';
import Link from "next/link";
import Image from "next/image"; // Importar Image do Next.js

export default function AdminProductList() {
    const [products, setProducts] = useState<ProductItf[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user } = useGlobalStore();

    const fetchProducts = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/products`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setProducts(data);
        } catch (err: unknown) {
            console.error("Erro ao buscar produtos:", err);
            setError("Não foi possível carregar os produtos. Verifique a conexão com a API.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleDeleteProduct = async (productId: string, productName: string) => {
        if (!user.id || user.role !== "ADMIN" || !user.token) {
            toast.error("Você não tem permissão para deletar produtos.");
            return;
        }

        if (!confirm(`Tem certeza que deseja deletar o produto "${productName}"?`)) {
            return;
        }

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/products/${productId}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${user.token}`
                }
            });

            if (response.ok) {
                toast.success(`Produto "${productName}" deletado com sucesso!`);
                // Atualiza a lista de produtos no estado, removendo o produto deletado
                setProducts(prevProducts => prevProducts.filter(p => p.id !== productId));
            } else {
                const errorData = await response.json();
                toast.error(errorData.message || "Erro ao deletar produto.");
            }
        } catch (error) {
            console.error("Erro na requisição de deletar produto:", error);
            toast.error("Erro ao deletar produto. Tente novamente mais tarde.");
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <p className="text-xl text-gray-700 dark:text-gray-300">Carregando produtos...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <p className="text-xl text-red-500">{error}</p>
            </div>
        );
    }

    if (!user.id || user.role !== "ADMIN") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <p className="text-xl text-red-500">Acesso negado. Você não tem permissão para ver esta página.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-8 text-center">
                    Gerenciar Produtos
                </h1>

                <div className="flex justify-end mb-6">
                    <Link href="/admin/add-product" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-gray-700 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:bg-gray-600 dark:hover:bg-gray-700">
                        <svg className="-ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Adicionar Novo Produto
                    </Link>
                </div>

                {products.length === 0 ? (
                    <p className="text-center text-xl text-gray-600 dark:text-gray-400 mt-10">
                        Nenhum produto cadastrado.
                    </p>
                ) : (
                    <div className="overflow-x-auto bg-white dark:bg-gray-800 shadow-xl rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Imagem
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Nome
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Preço
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Estoque
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Categoria
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Ações
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {products.map((product) => (
                                    <tr key={product.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10">
                                                    <Image
                                                        className="h-10 w-10 rounded-full object-cover"
                                                        src={product.imageUrl || "/placeholder-image.png"}
                                                        alt={product.name}
                                                        width={40}
                                                        height={40}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">{product.name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 dark:text-white">
                                                R$ {Number(product.price).toLocaleString("pt-br", { minimumFractionDigits: 2 })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 dark:text-white">{product.stock}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {product.category || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Link href={`/admin/edit-product/${product.id}`} className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 mr-4">
                                                Editar
                                            </Link>
                                            <button
                                                onClick={() => handleDeleteProduct(product.id, product.name)}
                                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-100"
                                            >
                                                Deletar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}