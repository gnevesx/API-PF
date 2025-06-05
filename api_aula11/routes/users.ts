// API_AULA11/routes/users.ts

import { Role } from "@prisma/client";
import { Router } from "express";
import bcrypt from 'bcrypt';
import { z } from 'zod';
import jwt from "jsonwebtoken";
import prisma from '../prisma/client.js';
import nodemailer from 'nodemailer'; // Importa o Nodemailer
import crypto from 'crypto'; // Importa o módulo crypto para gerar códigos

const router = Router();

// Schema para validação de criação de usuário
const userCreateSchema = z.object({
    name: z.string().min(3, { message: "Nome deve possuir, no mínimo, 3 caracteres" }),
    email: z.string().email({ message: "E-mail inválido" }),
    password: z.string().min(8, { message: "Senha deve possuir, no mínimo, 8 caracteres" }),
    role: z.nativeEnum(Role).optional(),
});

// Schema para validação de atualização de usuário (senha é opcional)
const userUpdateSchema = z.object({
    name: z.string().min(3, { message: "Nome deve possuir, no mínimo, 3 caracteres" }).optional(),
    email: z.string().email({ message: "E-mail inválido" }).optional(),
    password: z.string().min(8, { message: "Senha deve possuir, no mínimo, 8 caracteres" }).optional(),
    role: z.nativeEnum(Role).optional(),
});

// Schema para solicitar recuperação de senha
const forgotPasswordSchema = z.object({
    email: z.string().email({ message: "E-mail inválido" }),
});

// Schema para resetar a senha
const resetPasswordSchema = z.object({
    email: z.string().email({ message: "E-mail inválido" }),
    recoveryCode: z.string().min(6, { message: "Código de recuperação inválido" }).max(6, { message: "Código de recuperação inválido" }),
    newPassword: z.string().min(8, { message: "Senha deve possuir, no mínimo, 8 caracteres" }),
});

// Função para validar a complexidade da senha
function validatePasswordComplexity(password: string): string[] {
    const messages: string[] = [];

    if (password.length < 8) {
        messages.push("Erro... senha deve possuir, no mínimo, 8 caracteres");
    }

    let lowerCase = 0;
    let upperCase = 0;
    let numbers = 0;
    let symbols = 0;

    for (const char of password) {
        if ((/[a-z]/).test(char)) {
            lowerCase++;
        } else if ((/[A-Z]/).test(char)) {
            upperCase++;
        } else if ((/[0-9]/).test(char)) {
            numbers++;
        } else {
            symbols++;
        }
    }

    if (lowerCase === 0) {
        messages.push("Erro... senha deve possuir letra(s) minúscula(s)");
    }

    if (upperCase === 0) {
        messages.push("Erro... senha deve possuir letra(s) maiúscula(s)");
    }

    if (numbers === 0) {
        messages.push("Erro... senha deve possuir número(s)");
    }

    if (symbols === 0) {
        messages.push("Erro... senha deve possuir símbolo(s)");
    }

    return messages;
}

// Configuração do Nodemailer
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT as string),
    secure: process.env.EMAIL_SECURE === 'true', // true para 465, false para outras portas como 587
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    // Adicione isto TEMPORARIAMENTE para depuração se o problema persistir APÓS verificar tudo acima.
    // Isso ignora erros de certificado SSL/TLS, o que pode resolver "Greeting never received"
    // em alguns ambientes de desenvolvimento, mas É INSEGURO para produção.
    tls: {
        rejectUnauthorized: false
    }
});

// Middleware de autenticação
const verifyToken = (req: any, res: any, next: any) => {
    const token = req.headers['x-access-token'];

    if (!token) {
        return res.status(403).json({ message: "Token não fornecido" });
    }

    try {
        const decoded = jwt.verify(token as string, process.env.JWT_KEY as string) as { userId: string, userRole: Role };
        req.userId = decoded.userId;
        req.userRole = decoded.userRole;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Token inválido" });
    }
};

// Middleware para verificar se o usuário é ADMIN
const verifyAdmin = (req: any, res: any, next: any) => {
    if (req.userRole !== Role.ADMIN) {
        return res.status(403).json({ message: "Acesso negado: Requer privilégios de administrador para esta operação." });
    }
    next();
};

// Rota: GET /users (apenas para ADMIN)
router.get("/", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            }
        });
        res.status(200).json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao buscar usuários" });
    }
});

// Rota: POST /users (criação de novo usuário)
router.post("/", async (req, res) => {
    const validation = userCreateSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ errors: validation.error.issues });
    }

    const { name, email, password, role } = validation.data;

    const passwordErrors = validatePasswordComplexity(password);
    if (passwordErrors.length > 0) {
        return res.status(400).json({ errors: passwordErrors });
    }

    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ message: "E-mail já cadastrado" });
        }

        const salt = bcrypt.genSaltSync(12);
        const hashedPassword = bcrypt.hashSync(password, salt);

        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: role || Role.VISITOR,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            }
        });
        res.status(201).json(newUser);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao criar usuário" });
    }
});

// Rota de Login: POST /users/login
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    const mensaPadrao = "Login ou senha incorretos";

    if (!email || !password) {
        return res.status(400).json({ erro: mensaPadrao });
    }

    try {
        const user = await prisma.user.findFirst({
            where: { email }
        });

        if (!user) {
            return res.status(400).json({ erro: mensaPadrao });
        }

        if (bcrypt.compareSync(password, user.password)) {
            const token = jwt.sign({
                userId: user.id,
                userRole: user.role
            },
                process.env.JWT_KEY as string,
                { expiresIn: "1h" }
            );

            res.status(200).json({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                token
            });
        } else {
            res.status(400).json({ erro: mensaPadrao });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Erro no servidor ao tentar fazer login." });
    }
});

// Rota: POST /users/forgot-password (Solicitar Código de Recuperação)
router.post("/forgot-password", async (req, res) => {
    const validation = forgotPasswordSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ erro: validation.error.issues[0].message });
    }

    const { email } = validation.data;

    try {
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            // Para segurança, não informamos se o e-mail não foi encontrado
            return res.status(200).json({ message: "Se o e-mail estiver cadastrado, um código de recuperação foi enviado." });
        }

        // Gerar um código de recuperação de 6 dígitos
        const recoveryCode = crypto.randomBytes(3).toString('hex').toUpperCase(); // 3 bytes = 6 caracteres hexadecimais
        // Definir a expiração do código (ex: 15 minutos)
        const recoveryCodeExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

        await prisma.user.update({
            where: { id: user.id },
            data: {
                recoveryCode,
                recoveryCodeExpiresAt,
            },
        });

        // Enviar o código para o e-mail do cliente
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Código de Recuperação de Senha',
            html: `
                <p>Olá ${user.name},</p>
                <p>Você solicitou a recuperação de senha para sua conta.</p>
                <p>Seu código de recuperação é: <strong>${recoveryCode}</strong></p>
                <p>Este código é válido por 15 minutos.</p>
                <p>Se você não solicitou isso, por favor, ignore este e-mail.</p>
                <p>Atenciosamente,</p>
                <p>Sua Equipe de Suporte</p>
            `,
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: "Código de recuperação enviado para o e-mail." });

    } catch (error) {
        console.error("Erro ao solicitar recuperação de senha:", error);
        res.status(500).json({ erro: "Erro ao processar sua solicitação de recuperação de senha." });
    }
});

// Rota: POST /users/reset-password (Alterar Senha com Código de Recuperação)
router.post("/reset-password", async (req, res) => {
    const validation = resetPasswordSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ erro: validation.error.issues[0].message });
    }

    const { email, recoveryCode, newPassword } = validation.data;

    const passwordErrors = validatePasswordComplexity(newPassword);
    if (passwordErrors.length > 0) {
        return res.status(400).json({ errors: passwordErrors });
    }

    try {
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || user.recoveryCode !== recoveryCode || !user.recoveryCodeExpiresAt || user.recoveryCodeExpiresAt < new Date()) {
            return res.status(400).json({ erro: "Código de recuperação inválido ou expirado." });
        }

        const salt = bcrypt.genSaltSync(12);
        const hashedPassword = bcrypt.hashSync(newPassword, salt);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                recoveryCode: null, // Limpa o código após o uso
                recoveryCodeExpiresAt: null, // Limpa a expiração
            },
        });

        res.status(200).json({ message: "Senha alterada com sucesso." });

    } catch (error) {
        console.error("Erro ao alterar senha:", error);
        res.status(500).json({ erro: "Erro ao alterar a senha." });
    }
});

// Rota: GET /users/:id (busca usuário por ID, pode ser acessado pelo próprio usuário ou ADMIN)
router.get("/:id", verifyToken, async (req: any, res) => {
    const { id } = req.params;

    if (req.userRole !== Role.ADMIN && req.userId !== id) {
        return res.status(403).json({ message: "Acesso negado: Você só pode visualizar seu próprio perfil." });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            }
        });
        if (!user) {
            return res.status(404).json({ message: "Usuário não encontrado" });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao buscar usuário" });
    }
});

// Rota: PUT /users/:id (atualiza usuário, pode ser acessado pelo próprio usuário ou ADMIN)
router.put("/:id", verifyToken, async (req: any, res) => {
    const { id } = req.params;

    if (req.userRole !== Role.ADMIN && req.userId !== id) {
        return res.status(403).json({ message: "Acesso negado: Você só pode atualizar seu próprio perfil." });
    }

    const validation = userUpdateSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ errors: validation.error.issues });
    }

    const { name, email, password, role } = validation.data;

    if (password) {
        const passwordErrors = validatePasswordComplexity(password);
        if (passwordErrors.length > 0) {
            return res.status(400).json({ errors: passwordErrors });
        }
    }

    try {
        const dataToUpdate: any = {};
        if (name) dataToUpdate.name = name;
        if (email) {
            const existingUser = await prisma.user.findUnique({ where: { email } });
            if (existingUser && existingUser.id !== id) {
                return res.status(409).json({ message: "E-mail já cadastrado para outro usuário" });
            }
            dataToUpdate.email = email;
        }
        if (password) {
            const salt = bcrypt.genSaltSync(12);
            dataToUpdate.password = bcrypt.hashSync(password, salt);
        }
        // A role só pode ser alterada por um ADMIN para outro usuário
        if (role && (req.userRole === Role.ADMIN)) {
            dataToUpdate.role = role;
        } else if (role && req.userRole !== Role.ADMIN && req.userId !== id) {
            return res.status(403).json({ message: "Você não tem permissão para alterar a função de outro usuário." });
        }


        const updatedUser = await prisma.user.update({
            where: { id },
            data: dataToUpdate,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            }
        });
        res.status(200).json(updatedUser);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao atualizar usuário" });
    }
});


// Rota: DELETE /users/:id (apenas para ADMIN)
router.delete("/:id", verifyToken, verifyAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const user = await prisma.user.delete({
            where: { id }
        });
        res.status(200).json({ message: `Usuário ${user.name} deletado com sucesso.` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao deletar usuário" });
    }
});

export default router;