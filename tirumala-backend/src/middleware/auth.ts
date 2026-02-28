import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface AuthJwtPayload {
  username: string;
}

/**
 * requireAuth
 * ───────────
 * Validates the JWT token. Checks in this order:
 *   1. httpOnly cookie  `auth_token`  (browser / web frontend)
 *   2. Authorization: Bearer <token>  (Postman / server-to-server)
 *
 * Attaches the decoded payload to `req.user` on success.
 * Returns 401 if the token is missing / invalid / expired.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  // 1. Cookie (preferred, set by the login endpoint)
  const cookieToken: string | undefined = (req as Request & { cookies: Record<string, string> }).cookies?.[env.cookieName];

  // 2. Authorization header fallback (for Postman / API clients)
  const authHeader = req.headers['authorization'];
  const bearerToken =
    typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : undefined;

  const token = cookieToken ?? bearerToken;

  if (!token) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret) as AuthJwtPayload;
    (req as Request & { user: AuthJwtPayload }).user = payload;
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}
