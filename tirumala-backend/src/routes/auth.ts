import { Router, type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { asyncHandler } from '../middleware/error';
import { getAdminUserByUsername } from '../services/supabase.service';
import { env } from '../config/env';

const router = Router();

/** Convert a JWT expiresIn string like "7d" / "12h" / "30m" to milliseconds */
function expiresInToMs(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000; // default 7 days
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1_000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };
  return value * multipliers[unit];
}

/**
 * POST /api/auth/login
 * ────────────────────
 * Body: { username: string, password: string }
 *
 * Sets an httpOnly cookie `auth_token` with the signed JWT.
 * Cookie is also readable as a Bearer token for non-browser clients.
 */
router.post(
  '/login',
  asyncHandler(async (req: Request, res: Response) => {
    const { username, password } = req.body ?? {};

    if (typeof username !== 'string' || typeof password !== 'string') {
      res.status(400).json({ success: false, error: 'username and password are required' });
      return;
    }

    const user = await getAdminUserByUsername(username);

    // Use a constant-time comparison even when user is not found
    // to prevent user-enumeration via timing attacks.
    const dummyHash = '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ01234';
    const hashToCompare = user?.password_hash ?? dummyHash;

    const isValid = await bcrypt.compare(password, hashToCompare);

    if (!user || !isValid) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign({ username: user.username }, env.jwtSecret, {
      expiresIn: env.jwtExpiresIn,
    } as jwt.SignOptions);

    // ── Set httpOnly cookie ───────────────────────────────────────────────────
    res.cookie(env.cookieName, token, {
      httpOnly: true,                              // not accessible via document.cookie
      secure: env.nodeEnv === 'production',        // HTTPS-only in production
      sameSite: env.nodeEnv === 'production' ? 'strict' : 'lax',
      maxAge: expiresInToMs(env.jwtExpiresIn),     // keeps cookie alive as long as the JWT
      path: '/',
    });

    res.json({
      success: true,
      expiresIn: env.jwtExpiresIn,
      username: user.username,
      // token is intentionally NOT returned in the body — it lives in the cookie.
      // Non-browser clients (Postman) can still use Authorization: Bearer <token>
      // by calling this endpoint with cookie support enabled.
    });
  })
);

/**
 * POST /api/auth/logout
 * ─────────────────────
 * Clears the auth cookie.
 */
router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie(env.cookieName, { path: '/' });
  res.json({ success: true, message: 'Logged out' });
});

/**
 * GET /api/auth/me
 * ─────────────────
 * Returns the currently logged-in username (if cookie is valid).
 * Useful for the frontend to check session on page load.
 */
router.get('/me', (req: Request, res: Response) => {
  const cookieToken: string | undefined = (req as Request & { cookies: Record<string, string> }).cookies?.[env.cookieName];
  if (!cookieToken) {
    res.status(401).json({ success: false, error: 'Not authenticated' });
    return;
  }
  try {
    const payload = jwt.verify(cookieToken, env.jwtSecret) as { username: string };
    res.json({ success: true, username: payload.username });
  } catch {
    res.status(401).json({ success: false, error: 'Invalid or expired session' });
  }
});

export default router;
