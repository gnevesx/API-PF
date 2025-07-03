// api_aula11/src/middlewares/adminAuth.ts

import { Request, Response, NextFunction } from 'express';
// import { Role } from '@prisma/client'; // Importe Role aqui
// Defina manualmente os papéis se não houver enum exportado pelo Prisma
export enum Role {
  ADMIN = "ADMIN",
  EDITOR_ADMIN = "EDITOR_ADMIN"
}

// Middleware ORIGINAL, renomeado para verificar se o usuário é um Administrador (ADMIN) COMPLETO
export function verificarFullAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.usuario?.role === Role.ADMIN) { // Apenas ADMIN pode passar aqui
    return next();
  }
  return res.status(403).json({
    message: "Acesso negado: Requer privilégios de administrador completo para esta operação."
  });
}

// NOVO MIDDLEWARE: Para verificar se o usuário é um Administrador ou um Administrador Editor
export function verificarEditorAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.usuario?.role === Role.ADMIN || req.usuario?.role === Role.EDITOR_ADMIN) { // ADMIN ou EDITOR_ADMIN podem passar aqui
    return next();
  }
  return res.status(403).json({
    message: "Acesso negado: Requer privilégios de administrador ou editor para esta operação."
  });
}