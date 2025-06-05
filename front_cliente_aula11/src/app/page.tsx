"use client";

import { useEffect, useState, useCallback } from "react";
import { ProductItf } from "@/utils/types/ProductItf";
import { useGlobalStore } from "@/context/GlobalStore";
import { InputPesquisa } from "@/components/InputPesquisa";
import { ProductCard } from "@/components/ProductCard";

export default function Home() {
  const [products, setProducts] = useState<ProductItf[]>([]);
  const { user, loginUser } = useGlobalStore();

  // Buscar produtos
  const fetchProducts = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/products`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
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
              "x-access-token": storedUserToken,
            },
          });

          if (response.ok) {
            const userData = await response.json();
            loginUser({ ...userData, token: storedUserToken });
          } else {
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
      {/* Barra de pesquisa - Já estilizada */}
      <InputPesquisa setProducts={setProducts} />

      {/* Conteúdo principal - Envolvendo tudo em uma div com fundo para a página */}
      <div className="min-h-screen bg-white dark:bg-gray-900 py-8"> {/* Fundo branco */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Título principal com cores cinzas do tema */}
          <h1 className="text-center text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-12">
            Nossos <span className="underline decoration-gray-600 dark:decoration-gray-400">Produtos</span>
          </h1>

          {products.length === 0 ? (
            <p className="text-center text-xl text-gray-600 dark:text-gray-400 mt-10">
              Nenhum produto encontrado. Adicione alguns como admin!
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