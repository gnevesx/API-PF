// middlewares/adminAuth.ts

import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';

export function verificarAdmin(req: Request, res: Response, next: NextFunction) {
  // Graças ao `auth.ts`, o TypeScript agora entende `req.usuario`.
  // A verificação `req.usuario?.role` é segura: se `usuario` for nulo, a condição falha.
  if (req.usuario?.role === Role.ADMIN) {
    return next(); // Se for admin, permite a continuação.
  }

  // Se não for admin ou se o usuário não estiver no token, nega o acesso.
  return res.status(403).json({
    message: "Acesso negado: Requer privilégios de administrador para esta operação."
  });
}
