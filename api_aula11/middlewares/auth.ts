// middlewares/auth.ts

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';

// A interface agora reflete o schema: id é uma string.
export interface TokenPayload {
  id: string;
  role: Role;
}

// Estendendo a interface Request do Express de forma global.
declare global {
  namespace Express {
    export interface Request {
      usuario?: TokenPayload;
    }
  }
}

export function verificarToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ mensagem: 'Acesso negado. Token não fornecido.' });
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('FATAL: A variável de ambiente JWT_SECRET não foi definida!');
      return res.status(500).json({ mensagem: 'Erro interno do servidor.' });
    }

    const decodificado = jwt.verify(token, secret) as TokenPayload;
    req.usuario = decodificado;

    next();
  } catch (error) {
    return res.status(400).json({ mensagem: 'Token inválido ou expirado.' });
  }
}
