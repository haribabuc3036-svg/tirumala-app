import { Router, type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { asyncHandler } from '../middleware/error';
import { getAdminUserByUsername } from '../services/supabase.service';
import { env } from '../config/env';

const router = Router();

/**
 * POST /api/auth/login
 * ────────────────────
 * Body: { username: string, password: string }
 *
 * Returns a signed JWT token on success.
 * The token must be sent as:  Authorization: Bearer <token>
 * on all write (POST / PUT / PATCH / DELETE) requests.
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

    res.json({
      success: true,
      token,
      expiresIn: env.jwtExpiresIn,
      username: user.username,
    });
  })
);

export default router;
