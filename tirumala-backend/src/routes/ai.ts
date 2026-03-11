import { Router, type Request, type Response } from 'express';
import { asyncHandler } from '../middleware/error';
import { askSrivariAI, QuotaExceededError, type ChatMessage } from '../services/gemini.service';

const router = Router();

/**
 * POST /api/ai/chat
 *
 * Body:
 *   {
 *     message: string;          // the user's current prompt
 *     history?: Array<{         // previous turns (optional, for multi-turn chat)
 *       role: 'user' | 'model';
 *       content: string;
 *     }>;
 *   }
 *
 * Response:
 *   {
 *     success: true;
 *     reply: string;
 *     isOffTopic: boolean;
 *   }
 */
router.post(
  '/chat',
  asyncHandler(async (req: Request, res: Response) => {
    const { message, history } = req.body as {
      message?: string;
      history?: ChatMessage[];
    };

    if (!message?.trim()) {
      res.status(400).json({ success: false, error: '`message` is required.' });
      return;
    }

    if (message.trim().length > 2000) {
      res.status(400).json({ success: false, error: 'Message is too long (max 2000 characters).' });
      return;
    }

    // Validate history shape if provided
    if (history !== undefined) {
      if (!Array.isArray(history)) {
        res.status(400).json({ success: false, error: '`history` must be an array.' });
        return;
      }

      const validRoles = new Set(['user', 'model']);
      for (const turn of history) {
        if (!validRoles.has(turn.role) || typeof turn.content !== 'string') {
          res.status(400).json({
            success: false,
            error: 'Each history item must have a `role` of "user" or "model" and a string `content`.',
          });
          return;
        }
      }
    }

    try {
      const { reply, isOffTopic, sources, grounded } = await askSrivariAI({
        message: message.trim(),
        history: history ?? [],
      });
      res.json({ success: true, reply, isOffTopic, sources, grounded });
    } catch (err) {
      if (err instanceof QuotaExceededError) {
        res.status(503).json({
          success: false,
          error: 'SrivariAI is temporarily unavailable due to high demand. Please try again in a moment.',
          retryAfterSeconds: err.retryAfterSeconds,
        });
        return;
      }
      throw err; // re-throw for the global error handler
    }
  })
);

export default router;
