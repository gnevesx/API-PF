// FRONT_CLIENTE_AULA11/src/app/login/page.tsx
"use client"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { useGlobalStore } from "@/context/GlobalStore"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useState } from "react"

type Inputs = {
    email: string
    password: string
    keepConnected: boolean
}

type ForgotPasswordInputs = {
    email: string
}

type ResetPasswordInputs = {
    email: string
    recoveryCode: string
    newPassword: string
    confirmNewPassword: string
}

export default function Login() {
    const { register, handleSubmit } = useForm<Inputs>()
    const { register: registerForgot, handleSubmit: handleSubmitForgot, reset: resetForgot } = useForm<ForgotPasswordInputs>()
    const { register: registerReset, handleSubmit: handleSubmitReset, reset: resetReset } = useForm<ResetPasswordInputs>()

    const { loginUser } = useGlobalStore()
    const router = useRouter()

    const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false)
    const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)
    const [recoveryEmail, setRecoveryEmail] = useState("")

    async function handleLogin(data: Inputs) {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/users/login`, {
                headers: { "Content-Type": "application/json" },
                method: "POST",
                body: JSON.stringify({ email: data.email, password: data.password })
            })

            if (response.status === 200) {
                const userData = await response.json()

                loginUser({
                    id: userData.id,
                    name: userData.name,
                    email: userData.email,
                    role: userData.role,
                    createdAt: userData.createdAt,
                    updatedAt: userData.updatedAt,
                    token: userData.token
                })

                if (data.keepConnected) {
                    localStorage.setItem("userId", userData.id)
                    localStorage.setItem("userToken", userData.token)
                } else {
                    if (localStorage.getItem("userId")) {
                        localStorage.removeItem("userId")
                    }
                    if (localStorage.getItem("userToken")) {
                        localStorage.removeItem("userToken")
                    }
                }

                toast.success("Login realizado com sucesso!")
                router.push("/")
            } else {
                const errorData = await response.json();
                toast.error(errorData.erro || "Erro... Login ou senha incorretos");
            }
        } catch (error) {
            console.error("Erro ao tentar fazer login:", error);
            toast.error("Erro ao conectar com o servidor. Tente novamente mais tarde.");
        }
    }

    async function handleForgotPassword(data: ForgotPasswordInputs) {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/users/forgot-password`, {
                headers: { "Content-Type": "application/json" },
                method: "POST",
                body: JSON.stringify({ email: data.email })
            })

            if (response.status === 200) {
                toast.success("Código de recuperação enviado para o seu e-mail!");
                setRecoveryEmail(data.email);
                setShowForgotPasswordModal(false);
                setShowResetPasswordModal(true);
            } else {
                const errorData = await response.json();
                toast.error(errorData.erro || "Erro ao solicitar recuperação de senha.");
            }
        } catch (error) {
            console.error("Erro ao solicitar recuperação de senha:", error);
            toast.error("Erro ao conectar com o servidor. Tente novamente mais tarde.");
        } finally {
            resetForgot();
        }
    }

    async function handleResetPassword(data: ResetPasswordInputs) {
        if (data.newPassword !== data.confirmNewPassword) {
            toast.error("As senhas não coincidem.");
            return;
        }

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/users/reset-password`, {
                headers: { "Content-Type": "application/json" },
                method: "POST",
                body: JSON.stringify({
                    email: data.email,
                    recoveryCode: data.recoveryCode,
                    newPassword: data.newPassword
                })
            })

            if (response.status === 200) {
                toast.success("Senha alterada com sucesso! Faça login com sua nova senha.");
                setShowResetPasswordModal(false);
            } else {
                const errorData = await response.json();
                toast.error(errorData.erro || "Erro ao alterar senha. Verifique o código de recuperação.");
            }
        } catch (error) {
            console.error("Erro ao alterar senha:", error);
            toast.error("Erro ao conectar com o servidor. Tente novamente mais tarde.");
        } finally {
            resetReset();
        }
    }

    return (
        // Fundo com gradiente de cinza escuro para preto
        <section className="bg-gradient-to-br from-gray-900 to-black min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 dark:from-gray-950 dark:to-black">
            <div className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden md:mt-0 dark:bg-gray-800 dark:border-gray-700">
                <div className="p-8 space-y-6 sm:p-10">
                    <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-white text-center">
                        Bem-vindo(a) de Volta!
                    </h1>
                    <form className="space-y-6" onSubmit={handleSubmit(handleLogin)} >
                        <div>
                            <label htmlFor="email" className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">Seu e-mail</label>
                            <input type="email" id="email"
                                className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-gray-500 focus:border-gray-500 block w-full p-3 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white transition-all duration-200" /* Foco em cinza */
                                required
                                {...register("email")} />
                        </div>
                        <div>
                            <label htmlFor="password" className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">Senha de Acesso</label>
                            <input type="password" id="password"
                                className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-gray-500 focus:border-gray-500 block w-full p-3 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white transition-all duration-200" /* Foco em cinza */
                                required
                                {...register("password")} />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-start">
                                <div className="flex items-center h-5">
                                    <input id="remember"
                                        aria-describedby="remember" type="checkbox"
                                        className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-gray-600 dark:ring-offset-gray-800" /* Foco em cinza */
                                        {...register("keepConnected")} />
                                </div>
                                <div className="ml-3 text-sm">
                                    <label htmlFor="remember" className="text-gray-500 dark:text-gray-300">Manter Conectado</label>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowForgotPasswordModal(true)}
                                className="text-sm font-medium text-gray-600 hover:text-gray-700 hover:underline dark:text-gray-400 dark:hover:text-gray-300 transition-colors" /* Link em cinza */
                            >
                                Esqueceu sua senha?
                            </button>
                        </div>
                        {/* Botão principal com cor cinza mais marcante */}
                        <button type="submit" className="w-full text-white bg-gray-700 hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-gray-300 font-semibold rounded-lg text-lg px-5 py-3 text-center dark:bg-gray-700 dark:hover:bg-gray-800 dark:focus:ring-gray-800 transition-all duration-200 transform hover:-translate-y-0.5"> {/* Botão em cinza */}
                            Entrar
                        </button>
                        <p className="text-sm font-light text-gray-500 dark:text-gray-400 text-center">
                            Ainda não possui conta? <Link href="/register" className="font-medium text-gray-600 hover:underline dark:text-gray-400">Cadastre-se</Link> {/* Link em cinza */}
                        </p>
                    </form>
                </div>
            </div>

            {/* Modal de Recuperação de Senha (Solicitar Código) */}
            {showForgotPasswordModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex justify-center items-center z-50 p-4">
                    <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-sm dark:bg-gray-800">
                        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white text-center">Recuperar Senha</h2>
                        <form onSubmit={handleSubmitForgot(handleForgotPassword)}>
                            <div className="mb-5">
                                <label htmlFor="forgotEmail" className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">Seu e-mail</label>
                                <input type="email" id="forgotEmail"
                                    className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-gray-500 focus:border-gray-500 block w-full p-3 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white transition-all duration-200" /* Foco em cinza */
                                    required
                                    {...registerForgot("email")} />
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setShowForgotPasswordModal(false)}
                                    className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 text-sm font-medium text-white bg-gray-700 rounded-lg hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-800 transition-colors" /* Botão em cinza */
                                >
                                    Enviar Código
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Alteração de Senha (Com Código de Recuperação) */}
            {showResetPasswordModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex justify-center items-center z-50 p-4">
                    <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-sm dark:bg-gray-800">
                        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white text-center">Alterar Senha</h2>
                        <form onSubmit={handleSubmitReset(handleResetPassword)}>
                            <div className="mb-4">
                                <label htmlFor="resetEmail" className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">Seu e-mail</label>
                                <input type="email" id="resetEmail"
                                    className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-gray-500 focus:border-gray-500 block w-full p-3 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white transition-all duration-200" /* Foco em cinza */
                                    required
                                    defaultValue={recoveryEmail}
                                    {...registerReset("email")} />
                            </div>
                            <div className="mb-4">
                                <label htmlFor="recoveryCode" className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">Código de Recuperação</label>
                                <input type="text" id="recoveryCode"
                                    className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-gray-500 focus:border-gray-500 block w-full p-3 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white transition-all duration-200" /* Foco em cinza */
                                    required
                                    {...registerReset("recoveryCode")} />
                            </div>
                            <div className="mb-4">
                                <label htmlFor="newPassword" className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">Nova Senha</label>
                                <input type="password" id="newPassword"
                                    className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-gray-500 focus:border-gray-500 block w-full p-3 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white transition-all duration-200" /* Foco em cinza */
                                    required
                                    {...registerReset("newPassword")} />
                            </div>
                            <div className="mb-6">
                                <label htmlFor="confirmNewPassword" className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">Repetir Nova Senha</label>
                                <input type="password" id="confirmNewPassword"
                                    className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-gray-500 focus:border-gray-500 block w-full p-3 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white transition-all duration-200" /* Foco em cinza */
                                    required
                                    {...registerReset("confirmNewPassword")} />
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setShowResetPasswordModal(false)}
                                    className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 text-sm font-medium text-white bg-gray-700 rounded-lg hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-800 transition-colors" /* Botão em cinza */
                                >
                                    Alterar Senha
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    )
}