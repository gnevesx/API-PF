// FRONT_CLIENTE_AULA11/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Toaster } from 'sonner';
// NOVO NOME E CAMINHO:
import { GlobalStoreInitializer } from "../context/GlobalStoreInitializer"; // <-- Caminho ajustado

export const metadata: Metadata = {
    title: "Loja de Roupas Online",
    description: "Sua melhor loja de roupas online!",
    keywords: ["loja de roupas", "moda", "e-commerce", "roupas online"]
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="pt-br">
            <body>
                <GlobalStoreInitializer /> {/* NOVO NOME: */}
                <Header />
                {children}
                <Toaster richColors position="top-center" />
            </body>
        </html>
    );
}