"use client";

import { useEffect, useState, useCallback } from "react";
import { ProductItf } from "@/utils/types/ProductItf"; // Alias de importação
// REMOVIDO: import { useGlobalStore } from "@/context/GlobalStore"; // Não é mais necessário nesta página
import { InputPesquisa } from "@/components/InputPesquisa"; // Alias de importação
import { ProductCard } from "@/components/ProductCard"; // Alias de importação

export default function Home() {
    const [products, setProducts] = useState<ProductItf[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // REMOVIDO: const globalStore = useGlobalStore(); // Não é mais necessária aqui.
    // A variável 'user' também não é usada diretamente no JSX ou na lógica de Home.

    // Buscar produtos
    const fetchProducts = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // A variável de ambiente process.env.NEXT_PUBLIC_URL_API ainda é acessível globalmente
            const response = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/products`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setProducts(data);
        } catch (err: unknown) { // Tipo 'unknown' para o erro
            console.error("Erro ao buscar produtos:", err);
            setError("Não foi possível carregar os produtos. Tente novamente mais tarde.");
        } finally {
            setIsLoading(false);
        }
    }, []); 

    // Efeito para chamar fetchProducts na montagem do componente
    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]); 

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