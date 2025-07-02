"use client"

import { useEffect, useRef } from 'react';
import { useGlobalStore } from './GlobalStore'; // Importação do useGlobalStore
import { UserItf } from '@/utils/types/UserItf'; // Importação da tipagem UserItf

// --- Tipagens para as respostas da API ---
interface UserApiResponse {
    id: string;
    name: string;
    email: string;
    role: 'ADMIN' | 'VISITOR';
    createdAt?: string; 
    updatedAt?: string;
}

interface CartItemApi {
    productId: string;
    quantity: number;
    // Adicione outras propriedades se a API as retornar e você precisar delas,
    // como por exemplo: product: ProductItf;
}

interface CartApiResponse {
    cartItems: CartItemApi[];
}


export function GlobalStoreInitializer() {
    const initialized = useRef(false);
    const { user, loginUser, setCartItems, logoutUser } = useGlobalStore();

    useEffect(() => {
        console.log("Initializer useEffect started. Initialized:", initialized.current, "Current user.id:", user.id); 

        if (initialized.current) return;
        initialized.current = true;

        const storedUserId = localStorage.getItem("userId"); // Precisamos do ID para esta rota
        const storedUserToken = localStorage.getItem("userToken");
        console.log("storedUserToken from localStorage:", storedUserToken); 

        if (user.id) {
            console.log("User already in Zustand state. Skipping auto-login.");
            return;
        }

        if (storedUserId && storedUserToken) { // Verificamos se ambos estão presentes
            const autoLoginAndFetchCart = async () => {
                try {
                    console.log("Attempting auto-login for user ID:", storedUserId, "with token:", storedUserToken); 
                    // CORREÇÃO: Usando a rota /users/:id para buscar o perfil do usuário
                    const userResponse = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/users/${storedUserId}`, { 
                        headers: {
                            "Authorization": `Bearer ${storedUserToken}`,
                        },
                    });

                    console.log("User API response status:", userResponse.status); 
                    if (userResponse.status === 401 || userResponse.status === 403) {
                         console.error("Token inválido ou não autorizado. Realizando logout."); 
                         logoutUser(); 
                         return;
                    }
                    if (!userResponse.ok) {
                        console.error("Erro ao buscar dados do usuário no auto-login:", userResponse.status, await userResponse.text()); 
                        logoutUser();
                        return;
                    }

                    const userData: UserApiResponse = await userResponse.json();
                    console.log("User data received from API:", userData); 
                    
                    const userToLogin: UserItf = { 
                        id: userData.id,
                        name: userData.name,
                        email: userData.email,
                        role: userData.role,
                        token: storedUserToken, 
                        createdAt: userData.createdAt || new Date().toISOString(),
                        updatedAt: userData.updatedAt || new Date().toISOString(),
                    };

                    loginUser(userToLogin); 
                    console.log("loginUser called. User state updated."); 

                    // Busca o carrinho apenas após o login bem-sucedido
                    console.log("Attempting to fetch cart for user."); 
                    const cartResponse = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/cart`, { // Endpoint APENAS /cart
                        headers: {
                            "Authorization": `Bearer ${storedUserToken}`,
                        },
                    });

                    console.log("Cart API response status:", cartResponse.status); 
                    if (!cartResponse.ok) {
                        console.error("Erro ao buscar carrinho no auto-login:", await cartResponse.text()); 
                        setCartItems([]);
                    } else {
                        const cartData: CartApiResponse = await cartResponse.json();
                        console.log("Cart data received:", cartData); 
                        setCartItems(cartData.cartItems.map((item: CartItemApi) => ({
                            productId: item.productId,
                            quantity: item.quantity
                        })));
                    }
                } catch (error) {
                    console.error("Erro GERAL no auto-login ou ao buscar carrinho:", error); 
                    logoutUser();
                }
            };
            autoLoginAndFetchCart();
        } else {
            console.log("No storedUserToken or storedUserId found. Ensuring logout state."); 
            logoutUser();
        }

    }, [loginUser, setCartItems, logoutUser, user.id, user.token]); 


    return null; 
}