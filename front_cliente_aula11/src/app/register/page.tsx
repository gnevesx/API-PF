// FRONT_CLIENTE_AULA11/app/register/page.tsx
"use client"
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link"; // Para o link de volta ao login

type Inputs = {
    name: string;
    email: string;
    password: string;
    confirmPassword: string; // Para confirmar a senha
};

export default function Register() {
    const { register, handleSubmit, formState: { errors }, watch } = useForm<Inputs>();
    const router = useRouter();
    const password = watch("password"); // Observa o campo de senha

    async function handleRegister(data: Inputs) {
        if (data.password !== data.confirmPassword) {
            toast.error("As senhas não coincidem.");
            return;
        }

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/users`, { // Rota da API para criar usuário
                headers: { "Content-Type": "application/json" },
                method: "POST",
                body: JSON.stringify({
                    name: data.name,
                    email: data.email,
                    password: data.password // Envia a senha em texto claro, a API irá fazer o hash
                })
            });

            if (response.status === 201) { // 201 Created
                toast.success("Cadastro realizado com sucesso! Faça login para continuar.");
                router.push("/login"); // Redireciona para a página de login
            } else {
                const errorData = await response.json();
                // Tenta mostrar erros específicos da API (ex: email já cadastrado, validação de senha)
                const errorMessage = errorData.message || errorData.errors?.map((err: any) => err.message || err).join('; ') || "Erro ao tentar cadastrar usuário.";
                toast.error(errorMessage);
            }
        } catch (error) {
            console.error("Erro ao tentar cadastrar:", error);
            toast.error("Erro ao conectar com o servidor. Tente novamente mais tarde.");
        }
    }

    return (
        // Fundo com gradiente de cinza escuro para preto, replicando o de login
        <section className="bg-gradient-to-br from-gray-900 to-black min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 dark:from-gray-950 dark:to-black">
            <div className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden md:mt-0 dark:bg-gray-800 dark:border-gray-700">
                <div className="p-8 space-y-6 sm:p-10">
                    <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-white text-center">
                        Crie Sua Conta
                    </h1>
                    <form className="space-y-6" onSubmit={handleSubmit(handleRegister)}>
                        <div>
                            <label htmlFor="name" className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">Seu Nome</label>
                            <input
                                type="text"
                                id="name"
                                className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-gray-500 focus:border-gray-500 block w-full p-3 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white transition-all duration-200" /* Foco em cinza */
                                placeholder="Seu nome completo"
                                {...register("name", { required: "Nome é obrigatório", minLength: { value: 3, message: "Mínimo 3 caracteres" } })}
                            />
                            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                        </div>
                        <div>
                            <label htmlFor="email" className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">Seu E-mail</label>
                            <input
                                type="email"
                                id="email"
                                className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-gray-500 focus:border-gray-500 block w-full p-3 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white transition-all duration-200" /* Foco em cinza */
                                placeholder="nome@empresa.com"
                                {...register("email", { required: "E-mail é obrigatório", pattern: { value: /^\S+@\S+\.\S+$/, message: "E-mail inválido" } })}
                            />
                            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                        </div>
                        <div>
                            <label htmlFor="password" className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">Senha</label>
                            <input
                                type="password"
                                id="password"
                                className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-gray-500 focus:border-gray-500 block w-full p-3 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white transition-all duration-200" /* Foco em cinza */
                                placeholder="••••••••"
                                {...register("password", {
                                    required: "Senha é obrigatória",
                                    minLength: { value: 8, message: "Senha deve ter no mínimo 8 caracteres" },
                                })}
                            />
                            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                        </div>
                        <div>
                            <label htmlFor="confirmPassword" className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">Confirmar Senha</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-gray-500 focus:border-gray-500 block w-full p-3 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white transition-all duration-200" /* Foco em cinza */
                                placeholder="••••••••"
                                {...register("confirmPassword", {
                                    required: "Confirmação de senha é obrigatória",
                                    validate: value => value === password || "As senhas não coincidem"
                                })}
                            />
                            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
                        </div>
                        <button
                            type="submit"
                            className="w-full text-white bg-gray-700 hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-gray-300 font-semibold rounded-lg text-lg px-5 py-3 text-center dark:bg-gray-700 dark:hover:bg-gray-800 dark:focus:ring-gray-800 transition-all duration-200 transform hover:-translate-y-0.5" /* Botão em cinza */
                        >
                            Criar Conta
                        </button>
                        <p className="text-sm font-light text-gray-500 dark:text-gray-400 text-center">
                            Já possui uma conta? <Link href="/login" className="font-medium text-gray-600 hover:underline dark:text-gray-400">Faça login</Link> {/* Link em cinza */}
                        </p>
                    </form>
                </div>
            </div>
        </section>
    );
}