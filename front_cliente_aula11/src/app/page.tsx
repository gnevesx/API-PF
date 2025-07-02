"use client";

import { useEffect, useState, useCallback } from "react";
// CORREÇÃO: Alterados os caminhos de importação para relativos para resolver o erro de compilação.
import { ProductItf } from "../utils/types/ProductItf";
import { useGlobalStore } from "../context/GlobalStore";
import { InputPesquisa } from "../components/InputPesquisa";
import { ProductCard } from "../components/ProductCard";

export default function Home() {
    const [products, setProducts] = useState<ProductItf[]>([]);
    // Estados para uma melhor experiência do usuário
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const { user, loginUser } = useGlobalStore();

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
        } catch (err: any) {
            console.error("Erro ao buscar produtos:", err);
            setError("Não foi possível carregar os produtos. Tente novamente mais tarde.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Auto login
    useEffect(() => {
        fetchProducts();

        async function autoLoginUser() {
            const storedUserId = localStorage.getItem("userId");
            const storedUserToken = localStorage.getItem("userToken");

            if (storedUserId && storedUserToken && !user.id) {
                try {
                    const response = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/users/${storedUserId}`, {
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${storedUserToken}`,
                        },
                    });

                    if (response.ok) {
                        const userData = await response.json();
                        loginUser({ ...userData, token: storedUserToken });
                    } else {
                        // Se o token for inválido, limpa o localStorage
                        localStorage.removeItem("userId");
                        localStorage.removeItem("userToken");
                    }
                } catch (error) {
                    console.error("Erro no auto-login:", error);
                    localStorage.removeItem("userId");
                    localStorage.removeItem("userToken");
                }
            }
        }

        autoLoginUser();
    }, [fetchProducts, user.id, loginUser]);

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
