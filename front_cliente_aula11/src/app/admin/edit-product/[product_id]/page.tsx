// src/app/admin/edit-product/[product_id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from 'sonner';
import { useGlobalStore } from "@/context/GlobalStore";
import Link from "next/link";
import { ProductItf } from "@/utils/types/ProductItf"; // Certifique-se que esta tipagem está correta

// --- Tipagem dos campos do formulário de edição ---
// Deve ser igual aos campos do ProductItf, mas todos opcionais para atualização parcial
type EditInputs = {
    name: string;
    description?: string | null;
    price: number;
    imageUrl?: string | null;
    category?: string | null;
    size?: string | null;
    color?: string | null;
    stock: number;
};

// --- Tipagem para a resposta de erro da API ---
type ApiError = {
    message: string;
    errors?: any[]; // Para erros de validação do Zod, se o backend retornar
}

export default function EditProductPage() {
    const params = useParams();
    const productId = params.product_id as string; // Pega o ID do produto da URL
    const router = useRouter();
    const { user } = useGlobalStore();

    const { register, handleSubmit, reset, formState: { errors } } = useForm<EditInputs>();

    const [isLoadingProduct, setIsLoadingProduct] = useState(true);
    const [productFetchError, setProductFetchError] = useState<string | null>(null);
    const [currentProduct, setCurrentProduct] = useState<ProductItf | null>(null);

    // Efeito para buscar os dados do produto quando a página carrega
    useEffect(() => {
        // Redireciona se não for admin ou não estiver logado
        if (!user.id) {
            router.push('/login');
            toast.warning("Você precisa estar logado para acessar esta página.");
            return;
        }
        if (user.role !== "ADMIN") {
            router.push('/');
            toast.error("Acesso negado: Você não tem permissão para editar produtos.");
            return;
        }

        const fetchProduct = async () => {
            setIsLoadingProduct(true);
            setProductFetchError(null);
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/products/${productId}`, {
                    headers: {
                        "Authorization": `Bearer ${user.token}` // Protegendo a rota de busca do produto
                    }
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data: ProductItf = await response.json();
                setCurrentProduct(data);
                // Preenche o formulário com os dados atuais do produto
                reset({
                    name: data.name,
                    description: data.description,
                    price: data.price,
                    imageUrl: data.imageUrl,
                    category: data.category,
                    size: data.size,
                    color: data.color,
                    stock: data.stock
                });
            } catch (err: unknown) {
                console.error("Erro ao buscar detalhes do produto para edição:", err);
                setProductFetchError("Não foi possível carregar os detalhes do produto para edição.");
            } finally {
                setIsLoadingProduct(false);
            }
        };

        if (productId && user.token) { // Garante que o ID do produto e o token do usuário existem
            fetchProduct();
        }
    }, [productId, user.id, user.role, user.token, router, reset]); // Adicionado user.id, user.role, user.token, router e reset às dependências

    // Função para lidar com o envio do formulário de edição
    const onSubmit = async (data: EditInputs) => {
        if (!user.token) {
            toast.error("Erro de autenticação. Faça login novamente.");
            return;
        }

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/products/${productId}`, {
                method: "PUT", // Método PUT para atualização
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${user.token}`
                },
                body: JSON.stringify({
                    ...data,
                    // Garante que preço e estoque sejam enviados como números
                    price: Number(data.price),
                    stock: Number(data.stock)
                })
            });

            if (response.ok) {
                toast.success("Produto atualizado com sucesso!");
                router.push('/admin'); // Redireciona de volta para o dashboard
            } else {
                const errorData: ApiError = await response.json();
                const errorMessage = errorData.message || errorData.errors?.map((err: any) => err.message).join('; ') || "Erro ao atualizar produto.";
                toast.error(errorMessage);
            }
        } catch (error) {
            console.error("Erro na requisição de atualização de produto:", error);
            toast.error("Erro ao conectar. Tente novamente mais tarde.");
        }
    };

    // Renderização condicional
    if (!user.id || user.role !== "ADMIN") {
        return null; // O useEffect já deve redirecionar.
    }

    if (isLoadingProduct) {
        return (
            <div className="min-h-screen flex items-center justify-center text-center text-xl text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900">
                Carregando detalhes do produto para edição...
            </div>
        );
    }

    if (productFetchError) {
        return (
            <div className="min-h-screen flex items-center justify-center text-center text-xl text-red-500 bg-gray-50 dark:bg-gray-900">
                {productFetchError}
            </div>
        );
    }

    if (!currentProduct) {
        return (
            <div className="min-h-screen flex items-center justify-center text-center text-xl text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900">
                Produto não encontrado.
            </div>
        );
    }

    // Formulário de Edição
    return (
        <section className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
            <div className="max-w-2xl w-full mx-auto p-6 bg-white rounded-lg shadow-xl dark:bg-gray-800">
                <h1 className="mb-8 text-3xl font-extrabold leading-none tracking-tight text-gray-900 dark:text-white text-center">
                    Editar <span className="underline decoration-gray-600 dark:decoration-gray-400">{currentProduct.name}</span>
                </h1>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome do Produto</label>
                        <input type="text" id="name"
                            {...register("name", { required: "Nome é obrigatório", minLength: { value: 3, message: "Mínimo 3 caracteres" } })}
                            className="w-full p-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-gray-500 focus:border-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors"
                        />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descrição</label>
                        <textarea id="description" rows={4}
                            {...register("description", { minLength: { value: 10, message: "Mínimo 10 caracteres" } })}
                            className="w-full p-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-gray-500 focus:border-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors"
                        ></textarea>
                        {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
                    </div>

                    <div>
                        <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preço (R$)</label>
                        <input type="number" id="price" step="0.01"
                            {...register("price", { required: "Preço é obrigatório", min: { value: 0.01, message: "Preço deve ser maior que zero" }, valueAsNumber: true })}
                            className="w-full p-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-gray-500 focus:border-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors"
                        />
                        {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
                    </div>

                    <div>
                        <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL da Imagem</label>
                        <input type="text" id="imageUrl"
                            {...register("imageUrl", { pattern: { value: /^(ftp|http|https):\/\/[^ "]+$/, message: "URL inválida" } })} // Validação de URL
                            className="w-full p-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-gray-500 focus:border-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors"
                            placeholder="Ex: https://seusite.com/imagem.jpg"
                        />
                        {errors.imageUrl && <p className="text-red-500 text-xs mt-1">{errors.imageUrl.message}</p>}
                    </div>

                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoria</label>
                        <input type="text" id="category"
                            {...register("category")}
                            className="w-full p-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-gray-500 focus:border-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors"
                            placeholder="Ex: Camisetas, Calças, Acessórios"
                        />
                    </div>

                    <div>
                        <label htmlFor="size" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tamanho</label>
                        <input type="text" id="size"
                            {...register("size")}
                            className="w-full p-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-gray-500 focus:border-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors"
                            placeholder="Ex: P, M, G, Único"
                        />
                    </div>

                    <div>
                        <label htmlFor="color" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cor</label>
                        <input type="text" id="color"
                            {...register("color")}
                            className="w-full p-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-gray-500 focus:border-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors"
                            placeholder="Ex: Azul, Preto, Branco"
                        />
                    </div>

                    <div>
                        <label htmlFor="stock" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estoque</label>
                        <input type="number" id="stock"
                            {...register("stock", { required: "Estoque é obrigatório", min: { value: 0, message: "Estoque não pode ser negativo" }, valueAsNumber: true })}
                            className="w-full p-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-gray-500 focus:border-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors"
                        />
                        {errors.stock && <p className="text-red-500 text-xs mt-1">{errors.stock.message}</p>}
                    </div>

                    <div className="flex justify-end space-x-4 mt-6">
                        <Link href="/admin" className="px-6 py-3 text-lg font-medium text-center text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 focus:ring-4 focus:outline-none focus:ring-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-800 transition-colors">
                            Cancelar
                        </Link>
                        <button type="submit" className="px-6 py-3 text-lg font-medium text-center text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-700 dark:hover:bg-blue-800 dark:focus:ring-blue-800 transition-colors">
                            Salvar Alterações
                        </button>
                    </div>
                </form>
            </div>
        </section>
    );
}