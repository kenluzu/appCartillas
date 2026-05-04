import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

export const JWT_SECRET = process.env.JWT_SECRET ?? "ponte_la10_dev_secret_changeme";

export type AdminPayload = { cedula: string; nombre: string; rol: "ADMIN" };

declare global {
  namespace Express {
    interface Request {
      admin?: AdminPayload;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Token requerido" });
    return;
  }

  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as AdminPayload;
    if (payload.rol !== "ADMIN") {
      res.status(403).json({ error: "Acceso denegado" });
      return;
    }
    req.admin = payload;
    next();
  } catch {
    res.status(401).json({ error: "Token inválido o expirado" });
  }
}
