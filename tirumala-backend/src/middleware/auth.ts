import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface AuthJwtPayload {
  username: string;
}

/**
 * requireAuth
 * ───────────
 * Validates the Bearer JWT token in the Authorization header.
 * Attaches the decoded payload to `req.user` on success.
 * Returns 401 if the token is missing/invalid/expired.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Missing or invalid Authorization header' });
    return;
  }

  const token = authHeader.slice(7); // strip "Bearer "

  try {
    const payload = jwt.verify(token, env.jwtSecret) as AuthJwtPayload;
    (req as Request & { user: AuthJwtPayload }).user = payload;
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}
