// src/app/admin/page.tsx
'use client';

import { useEffect, useState, useCallback } from "react";
import { toast } from 'sonner';
import { useGlobalStore } from "@/context/GlobalStore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ProductItf } from "@/utils/types/ProductItf"; // Importar ProductItf para a listagem
import Image from "next/image"; // Importar Image para a listagem

// Importações da Victory Chart
import {
    VictoryBar,
    VictoryChart,
    VictoryAxis,
    VictoryTheme,
    VictoryPie,
} from 'victory';

// Definir interfaces para dados do dashboard, se necessário
interface ProductSummary {
    totalProducts: number;
    productsByCategory: { category: string; count: number; totalStock: number }[];
    totalStock: number;
}

// NOVAS INTERFACES para os dados do carrinho como vêm da API /cart/admin/all
interface AdminUserInCart { // Informações do usuário que vem dentro do objeto de carrinho
    id: string;
    name: string;
    email: string;
}

interface AdminProductInCartItem { // Informações do produto que vem dentro do item do carrinho
    id: string;
    name: string;
    price: number;
    imageUrl: string | null;
}

interface AdminCartItemApi { // Estrutura de um item individual dentro do carrinho da API
    id: string;
    quantity: number;
    productId: string;
    cartId: string;
    product: AdminProductInCartItem; // Usando a interface do produto dentro do item
}

interface AdminFullCartApi { // Estrutura completa de um objeto de carrinho retornado pela rota /cart/admin/all
    id: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
    user: AdminUserInCart; // Usando a interface do usuário
    cartItems: AdminCartItemApi[]; // Array de itens do carrinho
}

// Definir interface para o estado do frontend dos carrinhos (mais simples para exibir)
interface CartSummary {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    totalItems: number;
    totalPrice: number;
    createdAt: string;
}

export default function AdminDashboardPage() {
    const { user } = useGlobalStore();
    const router = useRouter();

    const [loadingDashboardData, setLoadingDashboardData] = useState(true);
    const [dashboardError, setDashboardError] = useState<string | null>(null);

    // =========================================================
    // Estados e Funções para LISTAGEM DE PRODUTOS
    // =========================================================
    const [products, setProducts] = useState<ProductItf[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(true);
    const [productsError, setProductsError] = useState<string | null>(null);

    const fetchProducts = useCallback(async () => {
        setIsLoadingProducts(true);
        setProductsError(null);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/products`, {
                headers: {
                    "Authorization": `Bearer ${user.token}` 
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setProducts(data);
        } catch (err: unknown) {
            console.error("Erro ao buscar produtos para listagem:", err);
            setProductsError("Não foi possível carregar a lista de produtos.");
        } finally {
            setIsLoadingProducts(false);
        }
    }, [user.token]); 

    const handleDeleteProduct = async (productId: string, productName: string) => {
        if (!user.id || user.role !== "ADMIN" || !user.token) {
            toast.error("Você não tem permissão para deletar produtos.");
            return;
        }

        if (!confirm(`Tem certeza que deseja deletar o produto "${productName}"?`)) {
            return;
        }

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/products/${productId}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${user.token}`
                }
            });

            if (response.ok) {
                toast.success(`Produto "${productName}" deletado com sucesso!`);
                setProducts(prevProducts => prevProducts.filter(p => p.id !== productId));
                fetchProductSummary(); 
            } else {
                const errorData = await response.json();
                toast.error(errorData.message || "Erro ao deletar produto.");
            }
        } catch (error) {
            console.error("Erro na requisição de deletar produto:", error);
            toast.error("Erro ao deletar produto. Tente novamente mais tarde.");
        }
    };

    // =========================================================
    // Estados e Funções para GRÁFICOS (Resumo de Produtos)
    // =========================================================
    const [productSummary, setProductSummary] = useState<ProductSummary | null>(null);
    const [isLoadingSummary, setIsLoadingSummary] = useState(true);
    const [summaryError, setSummaryError] = useState<string | null>(null);

    const fetchProductSummary = useCallback(async () => {
        setIsLoadingSummary(true);
        setSummaryError(null);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/products/summary`, {
                headers: {
                    "Authorization": `Bearer ${user.token}`
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data: ProductSummary = await response.json();
            setProductSummary(data);
        } catch (err: unknown) {
            console.error("Erro ao buscar resumo de produtos:", err);
            setSummaryError("Não foi possível carregar o resumo de produtos.");
        } finally {
            setIsLoadingSummary(false);
        }
    }, [user.token]);

    // =========================================================
    // Estados e Funções para GERENCIAMENTO DE CARRINHOS
    // =========================================================
    const [customerCarts, setCustomerCarts] = useState<CartSummary[]>([]);
    const [isLoadingCarts, setIsLoadingCarts] = useState(true);
    const [cartsError, setCartsError] = useState<string | null>(null);

    const fetchCustomerCarts = useCallback(async () => {
        setIsLoadingCarts(true);
        setCartsError(null);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/cart/admin/all`, {
                headers: {
                    "Authorization": `Bearer ${user.token}`
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data: AdminFullCartApi[] = await response.json(); 
            
            setCustomerCarts(data.map((cart: AdminFullCartApi) => ({ 
                id: cart.id,
                userId: cart.userId,
                userName: cart.user?.name || 'N/A',
                userEmail: cart.user?.email || 'N/A',
                totalItems: cart.cartItems.reduce((sum: number, item: AdminCartItemApi) => sum + item.quantity, 0), 
                totalPrice: cart.cartItems.reduce((sum: number, item: AdminCartItemApi) => sum + (item.product?.price || 0) * item.quantity, 0),
                createdAt: cart.createdAt,
            })));
        } catch (err: unknown) { 
            console.error("Erro ao buscar carrinhos de clientes:", err);
            setCartsError("Não foi possível carregar os carrinhos de clientes.");
        } finally {
            setIsLoadingCarts(false);
        }
    }, [user.token]);

    const handleClearCustomerCart = async (userId: string, userName: string) => {
        if (!user.id || user.role !== "ADMIN" || !user.token) {
            toast.error("Você não tem permissão para esvaziar carrinhos.");
            return;
        }
        if (!confirm(`Tem certeza que deseja esvaziar o carrinho de "${userName}"?`)) {
            return;
        }

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/cart/admin/clear/${userId}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${user.token}`
                }
            });

            if (response.ok) {
                toast.success(`Carrinho de "${userName}" esvaziado com sucesso!`);
                setCustomerCarts(prevCarts => prevCarts.filter(cart => cart.userId !== userId));
            } else {
                const errorData = await response.json();
                toast.error(errorData.message || "Erro ao esvaziar carrinho.");
            }
        } catch (error) {
            console.error("Erro na requisição de esvaziar carrinho:", error);
            toast.error("Erro ao esvaziar carrinho. Tente novamente mais tarde.");
        }
    };


    // =========================================================
    // Efeitos de Carregamento e Autenticação Inicial do Dashboard
    // =========================================================
    useEffect(() => {
        console.log("AdminDashboardPage: useEffect principal disparado. user.id:", user.id, "user.role:", user.role);

        const isAuthenticating = (user.id === undefined && typeof window !== 'undefined' && localStorage.getItem("userToken"));

        if (isAuthenticating) {
            console.log("AdminDashboardPage: Auto-login em andamento, aguardando estado final do usuário.");
            return; 
        }

        if (!user.id) { 
            console.log("AdminDashboardPage: Usuário não logado ou token inválido, redirecionando para /login.");
            router.push('/login');
            toast.warning("Você precisa estar logado para acessar o painel administrativo.");
            return;
        }
        
        if (user.role !== "ADMIN") { 
            console.log("AdminDashboardPage: Usuário não é ADMIN, redirecionando para /.");
            router.push('/');
            toast.error("Acesso negado: Você não tem permissão para acessar esta página.");
            return;
        }

        console.log("AdminDashboardPage: Usuário é ADMIN. Buscando dados do dashboard.");
        if (!productSummary && !customerCarts.length && !products.length) { 
            setLoadingDashboardData(true); 
            Promise.all([
                fetchProducts(), 
                fetchProductSummary(),
                fetchCustomerCarts() 
            ])
            .then(() => {
                setDashboardError(null);
                console.log("AdminDashboardPage: Dados do dashboard carregados com sucesso.");
            })
            .catch((err) => {
                console.error("AdminDashboardPage: Erro ao carregar dados do dashboard:", err);
                setDashboardError("Não foi possível carregar todos os dados do dashboard.");
            })
            .finally(() => {
                setLoadingDashboardData(false); 
            });
        } else {
             setLoadingDashboardData(false);
        }

    }, [user.id, user.role, user.token, router, fetchProducts, fetchProductSummary, fetchCustomerCarts, productSummary, customerCarts.length, products.length]);


    // =========================================================
    // Renderização baseada no estado de carregamento e autenticação
    // =========================================================

    if (user.id === undefined && typeof window !== 'undefined' && localStorage.getItem("userToken")) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <p className="text-xl text-gray-700 dark:text-gray-300">Verificando permissões de administrador...</p>
            </div>
        );
    }
    
    if (!user.id || user.role !== "ADMIN") {
        return null; 
    }

    if (loadingDashboardData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <p className="text-xl text-gray-700 dark:text-gray-300">Carregando dados do Dashboard...</p>
            </div>
        );
    }

    if (dashboardError) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <p className="text-xl text-red-500">{dashboardError}</p>
            </div>
        );
    }

    // =========================================================
    // Renderização do Dashboard Consolidado
    // =========================================================
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-5xl font-extrabold text-gray-900 dark:text-white mb-10 text-center">
                    Dashboard Administrativo
                </h1>

                {/* Seção de Resumo e Gráficos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    {/* Card de Total de Produtos */}
                    <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Resumo de Produtos</h2>
                        {isLoadingSummary ? (
                            <p className="text-gray-600 dark:text-gray-400">Carregando resumo...</p>
                        ) : summaryError ? (
                            <p className="text-red-500">{summaryError}</p>
                        ) : productSummary ? (
                            <div>
                                <p className="text-lg text-gray-700 dark:text-gray-300 mb-2">
                                    Total de Produtos Cadastrados: <span className="font-semibold text-gray-900 dark:text-white">{productSummary.totalProducts}</span>
                                </p>
                                <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
                                    Estoque Total em todos os produtos: <span className="font-semibold text-gray-900 dark:text-white">{productSummary.totalStock}</span>
                                </p>

                                {/* Área para Gráfico por Categoria */}
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Produtos por Categoria</h3>
                                {productSummary.productsByCategory.length > 0 ? (
                                    <div className="w-full h-64"> {/* Define altura para o gráfico */}
                                        {/* Gráfico de Barras por Categoria (Contagem de Produtos) */}
                                        <div className="mt-4">
                                            <h4 className="text-lg font-medium mb-2">Contagem de Produtos por Categoria</h4>
                                            <VictoryChart
                                                theme={VictoryTheme.material}
                                                domainPadding={20}
                                                height={250} 
                                                // Gráfico de barras para contagem por categoria
                                            >
                                                <VictoryAxis
                                                    tickValues={productSummary.productsByCategory.map(d => d.category)}
                                                    tickFormat={productSummary.productsByCategory.map(d => d.category)}
                                                    style={{
                                                        tickLabels: { fill: "white", fontSize: 10, angle: -45, verticalAnchor: "middle", textAnchor: "end" },
                                                        axis: { stroke: "white" },
                                                        grid: { stroke: "gray", strokeDasharray: "4 4" }
                                                    }}
                                                />
                                                <VictoryAxis
                                                    dependentAxis
                                                    tickFormat={(x) => (`${Math.round(x)}`)}
                                                    style={{
                                                        tickLabels: { fill: "white", fontSize: 10 },
                                                        axis: { stroke: "white" },
                                                        grid: { stroke: "gray", strokeDasharray: "4 4" }
                                                    }}
                                                />
                                                <VictoryBar
                                                    data={productSummary.productsByCategory.map(item => ({ category: item.category, count: item.count }))}
                                                    x="category"
                                                    y="count"
                                                    labels={({ datum }) => datum.count}
                                                    style={{ data: { fill: "#61dafb" }, labels: { fill: "white" } }}
                                                />
                                            </VictoryChart>
                                        </div>

                                        {/* Gráfico de Pizza por Categoria (Contagem de Produtos) */}
                                        <div className="mt-8 flex justify-center">
                                            <h4 className="text-lg font-medium mb-2">Distribuição de Produtos por Categoria</h4>
                                            <VictoryPie
                                                data={productSummary.productsByCategory.map(item => ({ x: item.category, y: item.count }))}
                                                colorScale="qualitative" 
                                                radius={80} 
                                                innerRadius={30} 
                                                labelRadius={({ innerRadius }) => (typeof innerRadius === "number" ? innerRadius : 0) + 20 }
                                                labels={({ datum }) => `${datum.x}: ${datum.y}`}
                                                style={{ labels: { fill: "white", fontSize: 10 } }}
                                                padAngle={2}
                                            />
                                        </div>

                                    </div>
                                ) : (
                                    <p className="text-gray-500 dark:text-gray-400">Nenhuma categoria encontrada.</p>
                                )}
                            </div>
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400">Dados de resumo não disponíveis.</p>
                        )}
                    </div>

                    {/* Card para Outros Gráficos/Resumos Futuros */}
                    <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6 flex items-center justify-center">
                        <p className="text-gray-500 dark:text-gray-400 text-center">
                            Área para futuros gráficos e resumos (ex: vendas por mês).
                        </p>
                    </div>
                </div>

                {/* Seção de Gerenciar Produtos (Tabela) */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Lista de Produtos</h2>
                    <Link href="/admin/add-product" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-gray-700 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:bg-gray-600 dark:hover:bg-gray-700">
                        <svg className="-ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Adicionar Novo Produto
                    </Link>
                </div>

                {isLoadingProducts ? (
                    <p className="text-center text-xl text-gray-600 dark:text-gray-400 mt-10">
                        Carregando lista de produtos...
                    </p>
                ) : productsError ? (
                    <p className="text-center text-xl text-red-500 mt-10">
                        {productsError}
                    </p>
                ) : products.length === 0 ? (
                    <p className="text-center text-xl text-gray-600 dark:text-gray-400 mt-10">
                        Nenhum produto cadastrado.
                    </p>
                ) : (
                    <div className="overflow-x-auto bg-white dark:bg-gray-800 shadow-xl rounded-lg mb-12">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Imagem
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Nome
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Preço
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Estoque
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Categoria
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Ações
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {products.map((product) => (
                                    <tr key={product.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10">
                                                    <Image
                                                        className="h-10 w-10 rounded-full object-cover"
                                                        src={product.imageUrl || "/placeholder-image.png"}
                                                        alt={product.name}
                                                        width={40}
                                                        height={40}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">{product.name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 dark:text-white">
                                                R$ {Number(product.price).toLocaleString("pt-br", { minimumFractionDigits: 2 })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 dark:text-white">{product.stock}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {product.category || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Link href={`/admin/edit-product/${product.id}`} className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 mr-4">
                                                Editar
                                            </Link>
                                            <button
                                                onClick={() => handleDeleteProduct(product.id, product.name)}
                                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-100"
                                            >
                                                Deletar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Seção de Gerenciar Carrinhos de Clientes */}
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 mt-12">
                    Carrinhos de Clientes
                </h2>
                {isLoadingCarts ? (
                    <p className="text-center text-xl text-gray-600 dark:text-gray-400 mt-10">
                        Carregando carrinhos de clientes...
                    </p>
                ) : cartsError ? (
                    <p className="text-center text-xl text-red-500 mt-10">
                        {cartsError}
                    </p>
                ) : customerCarts.length === 0 ? (
                    <p className="text-center text-xl text-gray-600 dark:text-gray-400 mt-10">
                        Nenhum carrinho ativo encontrado.
                    </p>
                ) : (
                    <div className="overflow-x-auto bg-white dark:bg-gray-800 shadow-xl rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Cliente
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Itens
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Total
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Ações
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {customerCarts.map((cart) => (
                                    <tr key={cart.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">{cart.userName}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 dark:text-white">{cart.userEmail}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 dark:text-white">{cart.totalItems}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 dark:text-white">
                                                R$ {Number(cart.totalPrice).toLocaleString("pt-br", { minimumFractionDigits: 2 })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {/* Você pode adicionar um link para ver detalhes do carrinho ou um modal */}
                                            <button
                                                onClick={() => handleClearCustomerCart(cart.userId, cart.userName)}
                                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-100"
                                            >
                                                Esvaziar Carrinho
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}