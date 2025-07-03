// src/app/admin/add-product/page.tsx
"use client"
import { useForm } from "react-hook-form";
import { toast } from 'sonner';
import { useGlobalStore } from "@/context/GlobalStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link"; // Importar Link para o botão de cancelar

// --- Tipagem dos campos do formulário ---
type Inputs = {
    name: string;
    description: string;
    price: number;
    imageUrl: string;
    category: string;
    size: string;
    color: string;
    stock: number;
};

// Tipo específico para a resposta de erro da API
type ApiValidationError = {
    message: string;
    // CORREÇÃO: Tipando 'errors' de forma mais específica
    errors?: { message: string }[]; 
}

export default function AddProductPage() {
    const { user } = useGlobalStore();
    const router = useRouter();
    const { register, handleSubmit, reset, formState: { errors } } = useForm<Inputs>();

    // Efeito para verificar se o usuário está logado e se é ADMIN
    useEffect(() => {
        if (!user.id) {
            router.push('/login');
            toast.warning("Você precisa estar logado para acessar esta página.");
            return;
        } else if (user.role !== "ADMIN") {
            router.push('/');
            toast.error("Acesso negado: Você não tem permissão para adicionar produtos.");
            return;
        }
    }, [user, router]);


    const onSubmit = async (data: Inputs) => {
        if (!user.token) {
            toast.error("Erro de autenticação. Faça login novamente.");
            return;
        }

        try {
            const requestUrl = `${process.env.NEXT_PUBLIC_URL_API}/products`;
            const response = await fetch(requestUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${user.token}`
                },
                body: JSON.stringify({
                    ...data,
                    price: Number(data.price),
                    stock: Number(data.stock)
                })
            });

            if (response.ok) {
                toast.success("Produto adicionado com sucesso!");
                reset();
            } else {
                const errorData: ApiValidationError = await response.json();
                // CORREÇÃO: Tipando o parâmetro 'err' no map para { message: string }
                const errorMessage = errorData.message || (errorData.errors && errorData.errors.map((err: { message: string }) => err.message).join('; ')) || "Erro ao adicionar produto.";
                toast.error(errorMessage);
            }
        } catch (error) {
            console.error("Erro na requisição de adicionar produto:", error);
            toast.error("Erro de conexão. Tente novamente mais tarde.");
        }
    };

    if (!user.id || user.role !== "ADMIN") {
        return null;
    }

    return (
        // Container principal da página com fundo cinza MUITO escuro
        <section className="min-h-screen bg-gray-950 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            {/* Card do formulário com fundo cinza mais claro que o fundo, sombra forte e bordas arredondadas */}
            <div className="max-w-2xl w-full mx-auto p-8 bg-gray-800 rounded-xl shadow-2xl border border-gray-700">
                <h1 className="mb-8 text-4xl font-extrabold leading-none tracking-tight text-white text-center">
                    Adicionar <span className="underline decoration-blue-500">Novo Produto</span>
                </h1>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Nome do Produto</label>
                        <input type="text" id="name"
                            {...register("name", { required: "Nome é obrigatório", minLength: { value: 3, message: "Mínimo 3 caracteres" } })}
                            className="w-full p-3 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                        {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">Descrição</label>
                        <textarea id="description" rows={4}
                            {...register("description", { minLength: { value: 10, message: "Mínimo 10 caracteres" } })}
                            className="w-full p-3 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        ></textarea>
                        {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description.message}</p>}
                    </div>

                    <div>
                        <label htmlFor="price" className="block text-sm font-medium text-gray-300 mb-1">Preço (R$)</label>
                        <input type="number" id="price" step="0.01"
                            {...register("price", { required: "Preço é obrigatório", min: { value: 0.01, message: "Preço deve ser maior que zero" }, valueAsNumber: true })}
                            className="w-full p-3 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                        {errors.price && <p className="text-red-400 text-xs mt-1">{errors.price.message}</p>}
                    </div>

                    <div>
                        <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-300 mb-1">URL da Imagem</label>
                        <input type="text" id="imageUrl"
                            {...register("imageUrl", { pattern: { value: /^(ftp|http|https):\/\/[^ "]+$/, message: "URL inválida" } })}
                            className="w-full p-3 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="Ex: https://seusite.com/imagem.jpg"
                        />
                        {errors.imageUrl && <p className="text-red-400 text-xs mt-1">{errors.imageUrl.message}</p>}
                    </div>

                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-1">Categoria</label>
                        <input type="text" id="category"
                            {...register("category")}
                            className="w-full p-3 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="Ex: Camisetas, Calças, Acessórios"
                        />
                    </div>

                    <div>
                        <label htmlFor="size" className="block text-sm font-medium text-gray-300 mb-1">Tamanho</label>
                        <input type="text" id="size"
                            {...register("size")}
                            className="w-full p-3 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="Ex: P, M, G, Único"
                        />
                    </div>

                    <div>
                        <label htmlFor="color" className="block text-sm font-medium text-gray-300 mb-1">Cor</label>
                        <input type="text" id="color"
                            {...register("color")}
                            className="w-full p-3 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="Ex: Azul, Preto, Branco"
                        />
                    </div>

                    <div>
                        <label htmlFor="stock" className="block text-sm font-medium text-gray-300 mb-1">Estoque</label>
                        <input type="number" id="stock"
                            {...register("stock", { required: "Estoque é obrigatório", min: { value: 0, message: "Estoque não pode ser negativo" }, valueAsNumber: true })}
                            className="w-full p-3 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                        {errors.stock && <p className="text-red-400 text-xs mt-1">{errors.stock.message}</p>}
                    </div>

                    <div className="flex justify-end space-x-4 mt-8">
                        <Link href="/admin" className="px-6 py-3 text-lg font-medium text-center text-gray-300 bg-gray-600 rounded-lg hover:bg-gray-700 focus:ring-4 focus:outline-none focus:ring-gray-500 transition-colors">
                            Cancelar
                        </Link>
                        <button type="submit" className="px-6 py-3 text-lg font-medium text-center text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 transition-colors">
                            Adicionar Produto
                        </button>
                    </div>
                </form>
            </div>
        </section>
    );
}