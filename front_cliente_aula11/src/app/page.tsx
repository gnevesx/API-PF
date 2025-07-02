"use client";

import { useEffect, useState, useCallback } from "react";
import { ProductItf } from "@/utils/types/ProductItf"; // Alias de importação
import { useGlobalStore } from "@/context/GlobalStore"; // Alias de importação
import { InputPesquisa } from "@/components/InputPesquisa"; // Alias de importação
import { ProductCard } from "@/components/ProductCard"; // Alias de importação

export default function Home() {
    const [products, setProducts] = useState<ProductItf[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const { user } = useGlobalStore(); // 'loginUser' não é usado aqui, então removido da desestruturação

    // Buscar produtos
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
        } catch (err: unknown) { // CORREÇÃO: Altera 'any' para 'unknown'
            console.error("Erro ao buscar produtos:", err);
            setError("Não foi possível carregar os produtos. Tente novamente mais tarde.");
        } finally {
            setIsLoading(false);
        }
    }, []); // Dependência vazia: esta função só precisa ser criada uma vez

    // Efeito para chamar fetchProducts na montagem do componente
    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]); // Dependência: só roda quando fetchProducts muda (o que não acontece, por ser useCallback com dep. vazia)

    // REMOVIDO: Todo o bloco useEffect que continha a lógica de auto-login (autoLoginUser).
    // Essa lógica já é cuidada pelo GlobalStoreInitializer (que está no seu layout.tsx).

    return (
        <>
            <InputPesquisa setProducts={setProducts} />

            <div className="min-h-screen bg-white dark:bg-gray-900 py-8">
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                    <h1 className="text-center text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-12">
                        Nossos <span className="underline decoration-gray-600 dark:decoration-gray-400">Produtos</span>
                    </h1>

                    {isLoading ? (
                        <p className="text-center text-xl text-gray-600 dark:text-gray-400 mt-10">
                            A carregar produtos...
                        </p>
                    ) : error ? (
                        <p className="text-center text-xl text-red-500 mt-10">
                            {error}
                        </p>
                    ) : products.length === 0 ? (
                        <p className="text-center text-xl text-gray-600 dark:text-gray-400 mt-10">
                            Nenhum produto encontrado.
                        </p>
                    ) : (
                        <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                            {products.map((product) => (
                                <ProductCard key={product.id} data={product} />
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </>
    );
}