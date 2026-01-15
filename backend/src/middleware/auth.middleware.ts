import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { JwtPayload } from '../types/index.js';

// Laajennettu Request-tyyppi
export interface AuthRequest extends Request {
  user?: JwtPayload;
}

// JWT-autentikointi middleware
export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Autentikointi vaaditaan' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'dev-secret'
    ) as JwtPayload;

    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Virheellinen tai vanhentunut token' });
  }
}

// Roolin tarkistus middleware
export function authorize(...allowedRoles: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Autentikointi vaaditaan' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'Ei käyttöoikeutta' });
      return;
    }

    next();
  };
}
