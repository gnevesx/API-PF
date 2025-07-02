// routes/users.ts

import { Role } from "@prisma/client";
import { Router, Request, Response } from "express";
import bcrypt from 'bcrypt';
import { z } from 'zod';
import jwt from "jsonwebtoken";
import prisma from '../prisma/client.js';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Importando os middlewares centralizados
import { verificarToken } from '../middlewares/auth.js';
import { verificarAdmin } from '../middlewares/adminAuth.js';

const router = Router();

// --- ZOD SCHEMAS ---
const userCreateSchema = z.object({
    name: z.string().min(3, { message: "Nome deve possuir, no mínimo, 3 caracteres" }),
    email: z.string().email({ message: "E-mail inválido" }),
    password: z.string().min(8, { message: "Senha deve possuir, no mínimo, 8 caracteres" }),
    role: z.nativeEnum(Role).optional(),
});
const userUpdateSchema = z.object({
    name: z.string().min(3, { message: "Nome deve possuir, no mínimo, 3 caracteres" }).optional(),
    email: z.string().email({ message: "E-mail inválido" }).optional(),
    password: z.string().min(8, { message: "Senha deve possuir, no mínimo, 8 caracteres" }).optional(),
    role: z.nativeEnum(Role).optional(),
});
const forgotPasswordSchema = z.object({
    email: z.string().email({ message: "E-mail inválido" }),
});
const resetPasswordSchema = z.object({
    email: z.string().email({ message: "E-mail inválido" }),
    recoveryCode: z.string().min(6, { message: "Código de recuperação inválido" }).max(6, { message: "Código de recuperação inválido" }),
    newPassword: z.string().min(8, { message: "Senha deve possuir, no mínimo, 8 caracteres" }),
});

// --- INTERFACE PARA ATUALIZAÇÃO DE DADOS ---
interface UserUpdateData {
    name?: string;
    email?: string;
    password?: string;
    role?: Role;
}

// --- FUNÇÕES AUXILIARES ---
function validatePasswordComplexity(password: string): string[] {
    const messages: string[] = [];
    if (password.length < 8) messages.push("Erro... senha deve possuir, no mínimo, 8 caracteres");
    if (!/[a-z]/.test(password)) messages.push("Erro... senha deve possuir letra(s) minúscula(s)");
    if (!/[A-Z]/.test(password)) messages.push("Erro... senha deve possuir letra(s) maiúscula(s)");
    if (!/[0-9]/.test(password)) messages.push("Erro... senha deve possuir número(s)");
    if (!/[^a-zA-Z0-9]/.test(password)) messages.push("Erro... senha deve possuir símbolo(s)");
    return messages;
}

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT as string, 10),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// --- ROTAS ---

// Rota: GET /users (protegida para ADMIN)
router.get("/", verificarToken, verificarAdmin, async (req: Request, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true }
        });
        res.status(200).json(users);
    } catch (error) {
        console.error("Erro ao buscar usuários:", error);
        res.status(500).json({ error: "Erro ao buscar usuários" });
    }
});

// Rota: POST /users (criação de novo usuário, pública)
router.post("/", async (req: Request, res: Response) => {
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
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = await prisma.user.create({
            data: { name, email, password: hashedPassword, role: role || Role.VISITOR },
            select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true }
        });
        res.status(201).json(newUser);
    } catch (error) {
        console.error("Erro ao criar usuário:", error);
        res.status(500).json({ error: "Erro ao criar usuário" });
    }
});

// Rota de Login: POST /users/login (pública)
router.post("/login", async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const mensaPadrao = "Login ou senha incorretos";
    if (!email || !password) {
        return res.status(400).json({ erro: mensaPadrao });
    }
    try {
        const user = await prisma.user.findFirst({ where: { email } });
        if (!user) {
            return res.status(401).json({ erro: mensaPadrao });
        }
        const passwordMatches = await bcrypt.compare(password, user.password);
        if (passwordMatches) {
            const payload = { id: user.id, role: user.role };
            const secret = process.env.JWT_SECRET;
            if (!secret) {
                console.error("FATAL: A variável de ambiente JWT_SECRET não foi definida!");
                return res.status(500).json({ erro: "Erro interno do servidor." });
            }
            const token = jwt.sign(payload, secret, { expiresIn: "1h" });
            res.status(200).json({
                id: user.id, name: user.name, email: user.email, role: user.role, token
            });
        } else {
            res.status(401).json({ erro: mensaPadrao });
        }
    } catch (error) {
        console.error("Erro no servidor ao tentar fazer login:", error);
        res.status(500).json({ erro: "Erro no servidor ao tentar fazer login." });
    }
});

// Rota: POST /users/forgot-password (pública)
router.post("/forgot-password", async (req: Request, res: Response) => {
    const validation = forgotPasswordSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ erro: validation.error.issues[0].message });
    }
    const { email } = validation.data;
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(200).json({ message: "Se o e-mail estiver cadastrado, um código de recuperação foi enviado." });
        }
        const recoveryCode = crypto.randomBytes(3).toString('hex').toUpperCase();
        const recoveryCodeExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
        await prisma.user.update({
            where: { id: user.id },
            data: { recoveryCode, recoveryCodeExpiresAt },
        });
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Código de Recuperação de Senha',
            html: `<p>Olá ${user.name},</p><p>Seu código de recuperação é: <strong>${recoveryCode}</strong></p><p>Este código é válido por 15 minutos.</p>`,
        };
        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: "Código de recuperação enviado para o e-mail." });
    } catch (error) {
        console.error("Erro ao solicitar recuperação de senha:", error);
        res.status(500).json({ erro: "Erro ao processar sua solicitação." });
    }
});

// Rota: POST /users/reset-password (pública)
router.post("/reset-password", async (req: Request, res: Response) => {
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
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword, recoveryCode: null, recoveryCodeExpiresAt: null },
        });
        res.status(200).json({ message: "Senha alterada com sucesso." });
    } catch (error) {
        console.error("Erro ao alterar senha:", error);
        res.status(500).json({ erro: "Erro ao alterar a senha." });
    }
});

// Rota: GET /users/:id (protegida, ID é uma string)
router.get("/:id", verificarToken, async (req: Request, res: Response) => {
    if (!req.usuario) {
        return res.status(401).json({ message: "Falha na autenticação. Usuário não encontrado no token." });
    }
    const idParam = req.params.id;
    const { id: idFromToken, role: roleFromToken } = req.usuario;
    if (roleFromToken !== Role.ADMIN && idFromToken !== idParam) {
        return res.status(403).json({ message: "Acesso negado: Você só pode visualizar seu próprio perfil." });
    }
    try {
        const user = await prisma.user.findUnique({
            where: { id: idParam },
            select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true }
        });
        if (!user) {
            return res.status(404).json({ message: "Usuário não encontrado" });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error(`Erro ao buscar usuário com ID ${idParam}:`, error);
        res.status(500).json({ error: "Erro ao buscar usuário" });
    }
});

// Rota: PUT /users/:id (protegida, ID é uma string)
router.put("/:id", verificarToken, async (req: Request, res: Response) => {
    if (!req.usuario) {
        return res.status(401).json({ message: "Falha na autenticação. Usuário não encontrado no token." });
    }
    const idParam = req.params.id;
    const { id: idFromToken, role: roleFromToken } = req.usuario;
    if (roleFromToken !== Role.ADMIN && idFromToken !== idParam) {
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
        const dataToUpdate: UserUpdateData = {};
        if (name) dataToUpdate.name = name;
        if (email) {
            const existingUser = await prisma.user.findUnique({ where: { email } });
            if (existingUser && existingUser.id !== idParam) {
                return res.status(409).json({ message: "E-mail já cadastrado para outro usuário" });
            }
            dataToUpdate.email = email;
        }
        if (password) {
            const salt = await bcrypt.genSalt(12);
            dataToUpdate.password = await bcrypt.hash(password, salt);
        }
        if (role && roleFromToken === Role.ADMIN) {
            dataToUpdate.role = role;
        }
        const updatedUser = await prisma.user.update({
            where: { id: idParam },
            data: dataToUpdate,
            select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true }
        });
        res.status(200).json(updatedUser);
    } catch (error) {
        console.error(`Erro ao atualizar usuário com ID ${idParam}:`, error);
        res.status(500).json({ error: "Erro ao atualizar usuário" });
    }
});

// Rota: DELETE /users/:id (protegida para ADMIN, ID é uma string)
router.delete("/:id", verificarToken, verificarAdmin, async (req: Request, res: Response) => {
    const idParam = req.params.id;
    try {
        await prisma.user.delete({
            where: { id: idParam }
        });
        res.status(204).send();
    } catch (error) {
        console.error(`Erro ao deletar usuário com ID ${idParam}:`, error);
        res.status(500).json({ error: "Erro ao deletar usuário" });
    }
});

export default router;
