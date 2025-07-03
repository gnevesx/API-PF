// src/app/admin/page.tsx
'use client';

import { useEffect, useState, useCallback } from "react";
import { toast } from 'sonner';
import { useGlobalStore } from "@/context/GlobalStore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ProductItf } from "@/utils/types/ProductItf";
import Image from "next/image";

import {
    VictoryBar,
    VictoryChart,
    VictoryAxis,
    VictoryTheme,
    VictoryPie,
} from 'victory';

interface ProductSummary {
    totalProducts: number;
    productsByCategory: { category: string; count: number; totalStock: number }[];
    totalStock: number;
}

interface AdminUserInCart {
    id: string;
    name: string;
    email: string;
}

interface AdminProductInCartItem {
    id: string;
    name: string;
    price: number;
    imageUrl: string | null;
}

interface AdminCartItemApi {
    id: string;
    quantity: number;
    productId: string;
    cartId: string;
    product: AdminProductInCartItem;
}

interface AdminFullCartApi {
    id: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
    user: AdminUserInCart;
    cartItems: AdminCartItemApi[];
}

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
    const [products, setProducts] = useState<ProductItf[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(true);
    const [productsError, setProductsError] = useState<string | null>(null);
    const [productSummary, setProductSummary] = useState<ProductSummary | null>(null);
    const [isLoadingSummary, setIsLoadingSummary] = useState(true);
    const [summaryError, setSummaryError] = useState<string | null>(null);
    const [customerCarts, setCustomerCarts] = useState<CartSummary[]>([]);
    const [isLoadingCarts, setIsLoadingCarts] = useState(true);
    const [cartsError, setCartsError] = useState<string | null>(null);

    interface ClientUser {
        id: string;
        name: string;
        email: string;
        role: string;
    }

    const [clients, setClients] = useState<ClientUser[]>([]);
    const [isLoadingClients, setIsLoadingClients] = useState(true);
    const [clientsError, setClientsError] = useState<string | null>(null);

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

    const fetchClients = useCallback(async () => {
        setIsLoadingClients(true);
        setClientsError(null);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/users`, {
                headers: {
                    "Authorization": `Bearer ${user.token}`
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data: ClientUser[] = await response.json();
            setClients(data.filter(client => client.id !== user.id));
        } catch (err: unknown) {
            console.error("Erro ao buscar clientes:", err);
            setClientsError("Não foi possível carregar a lista de clientes.");
        } finally {
            setIsLoadingClients(false);
        }
    }, [user.id, user.token]);

    const handleDeleteClient = async (clientId: string, clientName: string, clientRole: string) => {
        if (!user.id || user.role !== "ADMIN" || !user.token) {
            toast.error("Você não tem permissão para deletar usuários.");
            return;
        }
        if (clientId === user.id) {
            toast.error("Você não pode deletar sua própria conta.");
            return;
        }
        if (clientRole === "ADMIN") {
            toast.error("Você não pode deletar outro administrador.");
            return;
        }

        if (!confirm(`Tem certeza que deseja EXCLUIR PERMANENTEMENTE a conta de "${clientName}"? Todos os dados associados (carrinhos, pedidos, etc.) também serão removidos.`)) {
            return;
        }

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/users/${clientId}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${user.token}`
                }
            });

            if (response.ok) {
                toast.success(`Conta de "${clientName}" excluída com sucesso!`);
                setClients(prevClients => prevClients.filter(client => client.id !== clientId));
                fetchCustomerCarts();
                fetchProductSummary();
            } else {
                const errorData = await response.json();
                toast.error(errorData.message || "Erro ao excluir conta de cliente.");
            }
        } catch (error) {
            console.error("Erro na requisição de deletar cliente:", error);
            toast.error("Erro ao excluir conta de cliente. Tente novamente mais tarde.");
        }
    };

    useEffect(() => {
        const isAuthenticating = (user.id === undefined && typeof window !== 'undefined' && localStorage.getItem("userToken"));

        if (isAuthenticating) {
            return;
        }

        if (!user.id) {
            router.push('/login');
            toast.warning("Você precisa estar logado para acessar o painel administrativo.");
            return;
        }

        if (user.role !== "ADMIN") {
            router.push('/');
            toast.error("Acesso negado: Você não tem permissão para acessar esta página.");
            return;
        }

        if (!productSummary && !customerCarts.length && !products.length && !clients.length) {
            setLoadingDashboardData(true);
            Promise.all([
                fetchProducts(),
                fetchProductSummary(),
                fetchCustomerCarts(),
                fetchClients()
            ])
            .then(() => {
                setDashboardError(null);
            })
            .catch((err) => {
                console.error("Erro ao carregar dados do dashboard:", err);
                setDashboardError("Não foi possível carregar todos os dados do dashboard.");
            })
            .finally(() => {
                setLoadingDashboardData(false);
            });
        } else {
             setLoadingDashboardData(false);
        }

    }, [user.id, user.role, user.token, router, fetchProducts, fetchProductSummary, fetchCustomerCarts, fetchClients, productSummary, customerCarts.length, products.length, clients.length]);

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

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-5xl font-extrabold text-gray-900 dark:text-white mb-10 text-center">
                    Dashboard Administrativo
                </h1>

                {/* Seção de Resumo e Gráficos */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                    {/* Card de Resumo de Produtos */}
                    <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Resumo de Produtos</h2>
                        {isLoadingSummary ? (
                            <p className="text-gray-600 dark:text-gray-400">Carregando resumo...</p>
                        ) : summaryError ? (
                            <p className="text-red-500">{summaryError}</p>
                        ) : productSummary ? (
                            <div>
                                <p className="text-lg text-gray-700 dark:text-gray-300 mb-2">
                                    Total de Produtos: <span className="font-semibold text-gray-900 dark:text-white">{productSummary.totalProducts}</span>
                                </p>
                                <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
                                    Estoque Total: <span className="font-semibold text-gray-900 dark:text-white">{productSummary.totalStock}</span>
                                </p>
                            </div>
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400">Dados de resumo não disponíveis.</p>
                        )}
                    </div>

                    {/* Gráfico de Barras por Categoria */}
                    <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6 col-span-1 md:col-span-1 flex flex-col items-center justify-center">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 text-center">Contagem de Produtos por Categoria</h3>
                        {(productSummary?.productsByCategory?.length ?? 0) > 0 ? (
                            <div className="w-full h-72">
                                <VictoryChart
                                    theme={VictoryTheme.material}
                                    domainPadding={{ x: 30 }}
                                    height={280}
                                    padding={{ top: 20, bottom: 80, left: 60, right: 20 }}
                                >
                                    <VictoryAxis
                                        tickValues={productSummary?.productsByCategory?.map(d => d.category) ?? []}
                                        tickFormat={productSummary?.productsByCategory?.map(d => d.category) ?? []}
                                        style={{
                                            tickLabels: { fill: "gray", fontSize: 10, angle: -45, verticalAnchor: "middle", textAnchor: "end" },
                                            axis: { stroke: "gray" },
                                            grid: { stroke: "transparent" }
                                        }}
                                    />
                                    <VictoryAxis
                                        dependentAxis
                                        tickFormat={(x) => (`${Math.round(x)}`)}
                                        style={{
                                            tickLabels: { fill: "gray", fontSize: 10 },
                                            axis: { stroke: "gray" },
                                            grid: { stroke: "gray", strokeDasharray: "4 4" }
                                        }}
                                    />
                                    <VictoryBar
                                        data={productSummary?.productsByCategory?.map(item => ({ category: item.category, count: item.count })) ?? []}
                                        x="category"
                                        y="count"
                                        labels={({ datum }) => datum.count}
                                        style={{ data: { fill: "#61dafb" }, labels: { fill: "white", fontSize: 10 } }}
                                    />
                                </VictoryChart>
                            </div>
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400">Nenhuma categoria encontrada.</p>
                        )}
                    </div>

                    {/* Gráfico de Pizza por Categoria */}
                    <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6 col-span-1 md:col-span-1 flex flex-col items-center justify-center">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 text-center">Distribuição de Produtos por Categoria</h3>
                        {(productSummary?.productsByCategory?.length ?? 0) > 0 ? (
                            <div className="w-full h-72 flex justify-center items-center relative">
                                <VictoryPie
                                    data={productSummary?.productsByCategory?.map(item => ({ x: item.category, y: item.count })) ?? []}
                                    colorScale="qualitative"
                                    radius={100}
                                    innerRadius={40}
                                    labelRadius={({ radius }) => (radius as number) + 20}
                                    labels={({ datum }) => `${datum.x}: ${datum.y}`}
                                    style={{
                                        labels: { fill: "white", fontSize: 10, fontWeight: "bold" },
                                        data: { fillOpacity: 0.9, stroke: "white", strokeWidth: 1 }
                                    }}
                                    padAngle={3}
                                />
                            </div>
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400">Nenhuma categoria encontrada.</p>
                        )}
                    </div>

                    {/* Card para Outros Gráficos/Resumos Futuros */}
                    <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6 flex items-center justify-center">
                        <p className="text-gray-500 dark:text-gray-400 text-center">
                            Área para futuros gráficos e resumos (ex: vendas por mês).
                        </p>
                    </div>
                </div>

                {/* Seção de Gerenciar Produtos */}
                <div className="flex justify-between items-center mb-6 mt-12">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Lista de Produtos</h2>
                    <Link href="/admin/add-product" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-700 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:bg-gray-600 dark:hover:bg-gray-700">
                        <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
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

                {/* Seção de Gerenciar Clientes (Usuários) */}
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 mt-12">
                    Gerenciar Clientes
                </h2>
                {isLoadingClients ? (
                    <p className="text-center text-xl text-gray-600 dark:text-gray-400 mt-10">
                        Carregando lista de clientes...
                    </p>
                ) : clientsError ? (
                    <p className="text-center text-xl text-red-500 mt-10">
                        {clientsError}
                    </p>
                ) : clients.length === 0 ? (
                    <p className="text-center text-xl text-gray-600 dark:text-gray-400 mt-10">
                        Nenhum cliente cadastrado.
                    </p>
                ) : (
                    <div className="overflow-x-auto bg-white dark:bg-gray-800 shadow-xl rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Nome
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Cargo
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Ações
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {clients.map((client) => (
                                    <tr key={client.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">{client.name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 dark:text-white">{client.email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 dark:text-white">{client.role}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {/* Previne que o admin logado se exclua ou exclua outros admins */}
                                            {user.id !== client.id && client.role !== "ADMIN" && (
                                                <button
                                                    onClick={() => handleDeleteClient(client.id, client.name, client.role)}
                                                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-100"
                                                >
                                                    Deletar Cliente
                                                </button>
                                            )}
                                            {/* Mensagem se for o próprio admin ou outro admin */}
                                            {(user.id === client.id || client.role === "ADMIN") && (
                                                <span className="text-gray-500 text-xs">Não pode deletar</span>
                                            )}
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