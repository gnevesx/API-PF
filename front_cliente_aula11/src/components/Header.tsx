"use client"
import Link from "next/link"
import { useGlobalStore } from "@/context/GlobalStore"
import { useRouter } from "next/navigation"
import Image from "next/image"; // Importando o componente Image do Next.js

export function Header() {
    const { user, logoutUser, cartItems } = useGlobalStore()
    const router = useRouter()

    const totalCartItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    function handleLogout() {
        if (confirm("Confirma saída do sistema?")) {
            logoutUser() // Limpa o estado e o localStorage

            // Adiciona um pequeno atraso (50 milissegundos) antes de redirecionar.
            // Isso dá um tempo para o React/Zustand processar a atualização do estado.
            setTimeout(() => {
                router.push("/login"); // Redireciona para a página de login
            }, 50); 
        }
    }

    return (
        <nav className="bg-white shadow-md py-3 px-6 dark:bg-gray-500"> 
            <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto">
                <Link href="/" className="flex items-center space-x-3 rtl:space-x-reverse">
                    <Image // Usando o componente Image do Next.js
                        src="/logo2.png"
                        className="h-12"
                        alt="Logo Loja"
                        width={48} // Ajuste conforme o tamanho real do seu logo
                        height={48} // Ajuste conforme o tamanho real do seu logo
                        priority // Se o logo for visível na primeira dobra da página
                    />
                    <span className="self-center text-3xl font-extrabold whitespace-nowrap text-gray-900 dark:text-white"> 
                        Elos
                    </span>
                </Link>
                <button data-collapse-toggle="navbar-solid-bg" type="button" className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors duration-200" aria-controls="navbar-solid-bg" aria-expanded="false"> {/* Cores cinzas e hover suave */}
                    <span className="sr-only">Open main menu</span>
                    <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 17 14">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 1h15M1 7h15M1 13h15" />
                    </svg>
                </button>
                <div className="hidden w-full md:block md:w-auto" id="navbar-solid-bg">
                    {/* Lista de links do menu */}
                    <ul className="flex flex-col font-medium mt-4 rounded-lg bg-gray-50 md:space-x-8 rtl:space-x-reverse md:flex-row md:mt-0 md:border-0 md:bg-transparent"> {/* Fundo cinza claro para mobile, transparente para desktop */}
                        {user.id ? (
                            <>
                                <li>
                                    {/* Texto de boas-vindas com cor preta */}
                                    <span className="text-gray-800 dark:text-white text-lg font-medium"> {/* Texto preto */}
                                        Olá, {user.name} ({user.role})
                                    </span>
                                </li>
                                {user.role === "ADMIN" && (
                                    <li>
                                        {/* Botão "Adicionar Produto" com cores cinzas e azul */}
                                        <Link href="/admin/add-product" className="text-white font-bold bg-gray-700 hover:bg-gray-800 focus:ring-2 focus:outline-none focus:ring-blue-500 rounded-lg text-sm px-4 py-2 text-center transition-colors duration-200"> {/* Fundo cinza, foco em azul */}
                                            Adicionar Produto
                                        </Link>
                                    </li>
                                )}
                                <li>
                                    {/* Botão "Meu Carrinho" com cores cinzas e azul, contador vermelho */}
                                    <Link href="/cart" className="relative text-white font-bold bg-gray-700 hover:bg-gray-800 focus:ring-2 focus:outline-none focus:ring-blue-500 rounded-lg text-sm px-4 py-2 text-center transition-colors duration-200"> {/* Fundo cinza, foco em azul */}
                                        Meu Carrinho
                                        {totalCartItems > 0 && (
                                            <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                                                {totalCartItems}
                                            </span>
                                        )}
                                    </Link>
                                </li>
                                <li>
                                    {/* Link "Sair" com cor preta e hover suave */}
                                    <span className="cursor-pointer font-bold text-gray-700 hover:text-gray-900 transition-colors duration-200" /* Texto preto e hover mais escuro */
                                        onClick={handleLogout}>
                                        Sair
                                    </span>
                                </li>
                            </>
                        ) : (
                            <li>
                                {/* Link "Entrar" com cor preta e hover suave */}
                                <Link href="/login" className="block py-2 px-3 md:p-0 text-white-700 rounded-sm hover:bg-gray-100 md:hover:bg-transparent md:border-0 hover:text-gray-900 transition-colors duration-200"> {/* Texto preto, hover cinza claro/mais escuro */}
                                    Entrar
                                </Link>
                            </li>
                        )}
                    </ul>
                </div>
            </div>
        </nav>
    )
}