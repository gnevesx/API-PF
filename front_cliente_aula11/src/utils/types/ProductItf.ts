// FRONT_CLIENTE_AULA11/src/utils/types/ProductItf.ts
export interface ProductItf {
    id: string;
    name: string;
    description: string | null;
    price: number;
    imageUrl: string | null;
    category: string | null; // Ex: "Camisetas", "Calças", "Acessórios"
    size: string | null;     // Ex: "P", "M", "G", "Único"
    color: string | null;    // Ex: "Preto", "Branco", "Azul"
    stock: number;
    createdAt: string;
    updatedAt: string;
}