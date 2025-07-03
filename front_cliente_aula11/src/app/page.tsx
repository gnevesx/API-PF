"use client";

import { useEffect, useState, useCallback } from "react";
import { ProductItf } from "@/utils/types/ProductItf"; // Alias de importação
import { InputPesquisa } from "@/components/InputPesquisa"; // Alias de importação
import { ProductCard } from "@/components/ProductCard"; // Alias de importação

export default function Home() {
    const [products, setProducts] = useState<ProductItf[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
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
            {/* InputPesquisa já tem seus próprios estilos, mas o fundo geral é definido aqui */}
            <InputPesquisa setProducts={setProducts} />

            {/* Container principal da página com fundo cinza MUITO escuro */}
            <div className="min-h-screen bg-gray-950 py-8"> {/* CORREÇÃO AQUI: Fundo mais escuro */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                    <h1 className="text-center text-4xl sm:text-5xl font-extrabold text-white mb-12"> {/* CORREÇÃO AQUI: Texto branco */}
                        Nossos <span className="underline decoration-blue-500">Produtos</span> {/* CORREÇÃO AQUI: Sublinhado azul */}
                    </h1>

                    {isLoading ? (
                        <p className="text-center text-xl text-gray-300 mt-10"> {/* CORREÇÃO AQUI: Texto cinza claro */}
                            A carregar produtos...
                        </p>
                    ) : error ? (
                        <p className="text-center text-xl text-red-400 mt-10"> {/* CORREÇÃO AQUI: Texto vermelho mais suave */}
                            {error}
                        </p>
                    ) : products.length === 0 ? (
                        <p className="text-center text-xl text-gray-300 mt-10"> {/* CORREÇÃO AQUI: Texto cinza claro */}
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