"use client"
import { ProductItf } from "@/utils/types/ProductItf";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type Inputs = {
    term: string
}

type InputPesquisaProps = {
    setProducts: React.Dispatch<React.SetStateAction<ProductItf[]>>
}

export function InputPesquisa({ setProducts }: InputPesquisaProps) {
    const { register, handleSubmit, reset, setFocus } = useForm<Inputs>()

    async function handleSearch(data: Inputs) {
        if (data.term.length < 2) {
            toast.error("Informe, no mínimo, 2 caracteres para a pesquisa.");
            return
        }

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/products/search/${data.term}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const foundProducts = await response.json();

            if (foundProducts.length === 0) {
                toast.info("Não há produtos com a palavra-chave informada.");
                setFocus("term");
                reset({ term: "" });
                return;
            }

            setProducts(foundProducts);
        } catch (error) {
            console.error("Erro ao pesquisar produtos:", error);
            toast.error("Erro ao pesquisar produtos. Tente novamente mais tarde.");
        }
    }

    async function showAllProducts() {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/products`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const allProducts = await response.json();
            reset({ term: "" });
            setProducts(allProducts);
        } catch (error) {
            console.error("Erro ao buscar todos os produtos:", error);
            toast.error("Erro ao carregar todos os produtos. Tente novamente mais tarde.");
        }
    }

    return (
        // Container mais espaçoso e centralizado, com um fundo leve para destaque
        <div className="flex flex-col sm:flex-row items-center justify-center mx-auto max-w-6xl mt-8 px-4 py-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <form className="flex-1 w-full sm:w-auto" onSubmit={handleSubmit(handleSearch)}>
                <label htmlFor="default-search" className="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white">Search</label>
                <div className="relative">
                    <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                        {/* Ícone de lupa com cor ajustada */}
                        <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z" />
                        </svg>
                    </div>
                    {/* Campo de input com padding maior e foco em cinza */}
                    <input type="search" id="default-search" className="block w-full p-4 ps-10 text-base text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-gray-500 focus:border-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white transition-all duration-200"
                        placeholder="Pesquisar por nome, categoria, cor ou descrição..."
                        required
                        {...register("term")} />
                    {/* Botão de Pesquisar com cores cinzas e efeito de hover */}
                    <button type="submit" className="cursor-pointer text-white absolute end-2.5 bottom-2.5 bg-gray-700 hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800 transition-colors duration-200">
                        Pesquisar
                    </button>
                </div>
            </form>
            {/* Botão "Exibir Todos" com cor cinza */}
            <button type="button"
                className="cursor-pointer mt-4 sm:mt-0 sm:ms-3 w-full sm:w-auto focus:outline-none text-white bg-gray-600 hover:bg-gray-700 focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-3 dark:bg-gray-700 dark:hover:bg-gray-600 dark:focus:ring-gray-800 transition-colors duration-200"
                onClick={showAllProducts}>
                Exibir Todos
            </button>
        </div>
    )
}