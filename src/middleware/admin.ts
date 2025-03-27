import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';

export const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Non authentifié' });
  }

  if (req.user.role !== UserRole.ADMIN) {
    return res.status(403).json({ error: 'Accès non autorisé' });
  }

  next();
}; 