// FRONT_CLIENTE_AULA11/context/GlobalStoreInitializer.ts
"use client"

import { useEffect, useRef } from 'react';
import { useGlobalStore } from './GlobalStore'; // <-- Caminho e nome da store atualizados

export function GlobalStoreInitializer() {
  const initialized = useRef(false);
  const loginUser = useGlobalStore((state) => state.loginUser);
  const setCartItems = useGlobalStore((state) => state.setCartItems);
  const user = useGlobalStore((state) => state.user);

  useEffect(() => {
    if (!initialized.current) {
      const storedUserId = localStorage.getItem("userId");
      const storedUserToken = localStorage.getItem("userToken");

      // Tenta fazer auto-login
      if (storedUserId && storedUserToken && !user.id) {
        async function autoLoginAndFetchCart() {
          try {
            // Primeiro, tenta logar o usuário
            const userResponse = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/users/${storedUserId}`, {
              headers: {
                "Content-Type": "application/json",
                "x-access-token": storedUserToken as string, // Adicionado 'as string'
              },
            });

            if (userResponse.ok) {
              const userData = await userResponse.json();
              const userLoggedIn = { ...userData, token: storedUserToken };
              loginUser(userLoggedIn);

              // AGORA, busca o carrinho do usuário logado
              const cartResponse = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/cart/${userLoggedIn.id}`, {
                headers: {
                  "x-access-token": storedUserToken as string, // Adicionado 'as string'
                },
              });

              if (cartResponse.ok) {
                const cartData = await cartResponse.json();
                setCartItems(cartData.cartItems.map((item: any) => ({ productId: item.productId, quantity: item.quantity })));
              } else {
                console.error("Erro ao buscar carrinho no auto-login:", await cartResponse.text());
                setCartItems([]);
              }
            } else {
              localStorage.removeItem("userId");
              localStorage.removeItem("userToken");
              setCartItems([]);
            }
          } catch (error) {
            console.error("Erro no auto-login ou ao buscar carrinho:", error);
            localStorage.removeItem("userId");
            localStorage.removeItem("userToken");
            setCartItems([]);
          }
        }
        autoLoginAndFetchCart();
      }
      initialized.current = true;
    }
  }, [loginUser, setCartItems, user.id]);

  // Quando o usuário muda (ex: faz login/logout manualmente), precisamos atualizar o carrinho
  useEffect(() => {
    // Apenas faz fetch se o usuário estiver logado e tiver um token válido
    if (user.id && user.token) { // Verifica user.token também aqui
        async function fetchCartForLoggedInUser() {
            try {
                const cartResponse = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/cart/${user.id}`, {
                    headers: { "x-access-token": user.token as string }, // Adicionado 'as string'
                });
                if (cartResponse.ok) {
                    const cartData = await cartResponse.json();
                    setCartItems(cartData.cartItems.map((item: any) => ({ productId: item.productId, quantity: item.quantity })));
                } else {
                    console.error("Erro ao buscar carrinho para usuário logado:", await cartResponse.text());
                    setCartItems([]);
                }
            } catch (error) {
                console.error("Erro ao buscar carrinho para usuário logado:", error);
                setCartItems([]);
            }
        }
        fetchCartForLoggedInUser();
    } else {
        setCartItems([]); // Limpa o carrinho se o usuário não está logado ou token é inválido
    }
  }, [user.id, user.token, setCartItems]); // user.token como dependência

  return null;
}