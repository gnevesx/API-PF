"use client"
import { useForm } from "react-hook-form";
import { toast } from 'sonner';
import { useGlobalStore } from "@/context/GlobalStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

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

// CORREÇÃO: Tipo específico para o erro de validação da API
type ApiValidationError = {
    message: string;
}

export default function AddProductPage() {
    const { user } = useGlobalStore();
    const router = useRouter();
    const { register, handleSubmit, reset, formState: { errors } } = useForm<Inputs>();
    console.log("Valor de NEXT_PUBLIC_URL_API:", process.env.NEXT_PUBLIC_URL_API); // Este log ainda está aqui para referência

    // Efeito para verificar se o usuário está logado e se é ADMIN
    useEffect(() => {
        if (!user.token) { // Verificar pelo token é mais seguro que pelo id
            router.push('/login');
            toast.warning("Você precisa estar logado para acessar esta página.");
        } else if (user.role !== "ADMIN") {
            router.push('/');
            toast.error("Acesso negado: Você não tem permissão para adicionar produtos.");
        }
    }, [user, router]);


    const onSubmit = async (data: Inputs) => {
        if (!user.token) {
            toast.error("Erro de autenticação. Faça login novamente.");
            return;
        }

        try {
            const requestUrl = `${process.env.NEXT_PUBLIC_URL_API}/products`;
            // NOVO CONSOLE.LOG ADICIONADO AQUI:
            console.log("URL de requisição para adicionar produto:", requestUrl); 
            
            const response = await fetch(requestUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    // CORREÇÃO: Enviando o token no formato padrão "Bearer"
                    "Authorization": `Bearer ${user.token}`
                },
                body: JSON.stringify({
                    ...data,
                    // Garante que o preço e o estoque sejam enviados como números
                    price: Number(data.price),
                    stock: Number(data.stock)
                })
            });

            if (response.ok) {
                toast.success("Produto adicionado com sucesso!");
                reset();
            } else {
                const errorData = await response.json();
                // CORREÇÃO: Removido o 'any' e usando o tipo 'ApiValidationError'
                const errorMessage = errorData.message || errorData.errors?.map((err: ApiValidationError) => err.message).join('; ') || "Erro ao adicionar produto.";
                toast.error(errorMessage);
            }
        } catch (error) {
            console.error("Erro na requisição de adicionar produto:", error);
            toast.error("Erro de conexão. Tente novamente mais tarde.");
        }
    };

    // Retorna nulo enquanto a verificação do useEffect redireciona o usuário
    if (!user.token || user.role !== "ADMIN") {
        return null;
    }

    return (
        // Container principal da página com fundo cinza claro para o layout geral
        <section className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-8 px-4">
            {/* Card do formulário com fundo branco/cinza escuro, sombra e bordas arredondadas */}
            <div className="max-w-2xl w-full mx-auto p-6 bg-white rounded-lg shadow-xl dark:bg-gray-800">
                <h1 className="mb-8 text-3xl font-extrabold leading-none tracking-tight text-gray-900 dark:text-white text-center">
                    Adicionar <span className="underline decoration-gray-600 dark:decoration-gray-400">Novo Produto</span> {/* Sublinhado em cinza */}
                </h1>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6"> {/* Espaçamento maior entre os campos */}
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome do Produto</label>
                        <input
                            type="text"
                            id="name"
                            {...register("name", { required: "Nome é obrigatório", minLength: { value: 3, message: "Mínimo 3 caracteres" } })}
                            className="w-full p-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-gray-500 focus:border-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors" /* Foco em cinza */
                        />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descrição</label>
                        <textarea
                            id="description"
                            {...register("description", { required: "Descrição é obrigatória", minLength: { value: 10, message: "Mínimo 10 caracteres" } })}
                            rows={4}
                            className="w-full p-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-gray-500 focus:border-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors" /* Foco em cinza */
                        ></textarea>
                        {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
                    </div>

                    <div>
                        <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preço (R$)</label>
                        <input
                            type="number"
                            id="price"
                            step="0.01"
                            {...register("price", { required: "Preço é obrigatório", min: { value: 0.01, message: "Preço deve ser maior que zero" }, valueAsNumber: true })}
                            className="w-full p-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-gray-500 focus:border-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors" /* Foco em cinza */
                        />
                        {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
                    </div>

                    <div>
                        <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL da Imagem</label>
                        <input
                            type="text"
                            id="imageUrl"
                            {...register("imageUrl", { required: "URL da imagem é obrigatória" })}
                            className="w-full p-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-gray-500 focus:border-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors" /* Foco em cinza */
                            placeholder="Ex: https://seusite.com/imagem.jpg"
                        />
                        {errors.imageUrl && <p className="text-red-500 text-xs mt-1">{errors.imageUrl.message}</p>}
                    </div>

                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoria</label>
                        <input
                            type="text"
                            id="category"
                            {...register("category")}
                            className="w-full p-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-gray-500 focus:border-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors" /* Foco em cinza */
                            placeholder="Ex: Camisetas, Calças, Acessórios"
                        />
                    </div>

                    <div>
                        <label htmlFor="size" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tamanho</label>
                        <input
                            type="text"
                            id="size"
                            {...register("size")}
                            className="w-full p-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-gray-500 focus:border-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors" /* Foco em cinza */
                            placeholder="Ex: P, M, G, Único"
                        />
                    </div>

                    <div>
                        <label htmlFor="color" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cor</label>
                        <input
                            type="text"
                            id="color"
                            {...register("color")}
                            className="w-full p-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-gray-500 focus:border-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors" /* Foco em cinza */
                            placeholder="Ex: Azul, Preto, Branco"
                        />
                    </div>

                    <div>
                        <label htmlFor="stock" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estoque</label>
                        <input
                            type="number"
                            id="stock"
                            {...register("stock", { required: "Estoque é obrigatório", min: { value: 0, message: "Estoque não pode ser negativo" }, valueAsNumber: true })}
                            className="w-full p-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-gray-500 focus:border-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors" /* Foco em cinza */
                        />
                        {errors.stock && <p className="text-red-500 text-xs mt-1">{errors.stock.message}</p>}
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3 px-6 border border-transparent rounded-lg shadow-sm text-lg font-medium text-white bg-gray-700 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors" /* Botão em cinza */
                    >
                        Adicionar Produto
                    </button>
                </form>
            </div>
        </section>
    );
}