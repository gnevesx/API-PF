// FRONT_CLIENTE_AULA11/utils/types/UserItf.ts
export interface UserItf {
    id: string;
    name: string;
    email: string;
    role: "ADMIN" | "VISITOR"; // Adicionado para refletir o enum Role do backend
    createdAt: string;
    updatedAt: string;
    token?: string; // Opcional, será usado para armazenar o JWT
}