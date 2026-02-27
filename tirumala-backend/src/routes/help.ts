import { Router, type Request, type Response } from 'express';
import { asyncHandler } from '../middleware/error';
import {
  getAllFaqs,
  insertFaq,
  updateFaq,
  deleteFaq,
  getAllDressCodeItems,
  insertDressCodeItem,
  updateDressCodeItem,
  deleteDressCodeItem,
  getAllDosDonts,
  insertDosDont,
  updateDosDont,
  deleteDosDont,
  getAllContactSupport,
  insertContactSupport,
  updateContactSupport,
  deleteContactSupport,
} from '../services/supabase.service';

const router = Router();

// ─── FAQs ─────────────────────────────────────────────────────────────────────

/**
 * GET /api/help/faqs
 * List all FAQs (including inactive — admin view).
 */
router.get(
  '/faqs',
  asyncHandler(async (_req: Request, res: Response) => {
    const data = await getAllFaqs();
    res.json({ success: true, count: data.length, data });
  })
);

/**
 * POST /api/help/faqs
 * Add a new FAQ.
 * Body: { question: string; answer: string; sort_order?: number; is_active?: boolean }
 */
router.post(
  '/faqs',
  asyncHandler(async (req: Request, res: Response) => {
    const { question, answer, sort_order, is_active } = req.body as {
      question?: string;
      answer?: string;
      sort_order?: number;
      is_active?: boolean;
    };

    if (!question?.trim() || !answer?.trim()) {
      res.status(400).json({ success: false, error: '`question` and `answer` are required.' });
      return;
    }

    const row = await insertFaq({ question, answer, sort_order, is_active });
    res.status(201).json({ success: true, data: row });
  })
);

/**
 * PUT /api/help/faqs/:id
 * Update an existing FAQ.
 */
router.put(
  '/faqs/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ success: false, error: 'Invalid `id`.' });
      return;
    }
    const row = await updateFaq(id, req.body);
    res.json({ success: true, data: row });
  })
);

/**
 * DELETE /api/help/faqs/:id
 * Remove a FAQ.
 */
router.delete(
  '/faqs/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ success: false, error: 'Invalid `id`.' });
      return;
    }
    await deleteFaq(id);
    res.json({ success: true });
  })
);

// ─── Dress Code ───────────────────────────────────────────────────────────────

/**
 * GET /api/help/dress-code
 * List all dress code items.
 */
router.get(
  '/dress-code',
  asyncHandler(async (_req: Request, res: Response) => {
    const data = await getAllDressCodeItems();
    res.json({ success: true, count: data.length, data });
  })
);

/**
 * POST /api/help/dress-code
 * Add a dress code item.
 * Body: { section: 'men'|'women'|'general'; content: string; sort_order?: number; is_active?: boolean }
 */
router.post(
  '/dress-code',
  asyncHandler(async (req: Request, res: Response) => {
    const { section, content, sort_order, is_active } = req.body as {
      section?: 'men' | 'women' | 'general';
      content?: string;
      sort_order?: number;
      is_active?: boolean;
    };

    if (!section || !['men', 'women', 'general'].includes(section)) {
      res.status(400).json({ success: false, error: '`section` must be "men", "women", or "general".' });
      return;
    }
    if (!content?.trim()) {
      res.status(400).json({ success: false, error: '`content` is required.' });
      return;
    }

    const row = await insertDressCodeItem({ section, content, sort_order, is_active });
    res.status(201).json({ success: true, data: row });
  })
);

/**
 * PUT /api/help/dress-code/:id
 * Update a dress code item.
 */
router.put(
  '/dress-code/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ success: false, error: 'Invalid `id`.' });
      return;
    }
    const row = await updateDressCodeItem(id, req.body);
    res.json({ success: true, data: row });
  })
);

/**
 * DELETE /api/help/dress-code/:id
 * Remove a dress code item.
 */
router.delete(
  '/dress-code/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ success: false, error: 'Invalid `id`.' });
      return;
    }
    await deleteDressCodeItem(id);
    res.json({ success: true });
  })
);

// ─── Do's & Don'ts ────────────────────────────────────────────────────────────

/**
 * GET /api/help/dos-donts
 * List all dos & don'ts items.
 */
router.get(
  '/dos-donts',
  asyncHandler(async (_req: Request, res: Response) => {
    const data = await getAllDosDonts();
    res.json({ success: true, count: data.length, data });
  })
);

/**
 * POST /api/help/dos-donts
 * Add a do or don't item.
 * Body: { type: 'do'|'dont'; content: string; sort_order?: number; is_active?: boolean }
 */
router.post(
  '/dos-donts',
  asyncHandler(async (req: Request, res: Response) => {
    const { type, content, sort_order, is_active } = req.body as {
      type?: 'do' | 'dont';
      content?: string;
      sort_order?: number;
      is_active?: boolean;
    };

    if (!type || !['do', 'dont'].includes(type)) {
      res.status(400).json({ success: false, error: '`type` must be "do" or "dont".' });
      return;
    }
    if (!content?.trim()) {
      res.status(400).json({ success: false, error: '`content` is required.' });
      return;
    }

    const row = await insertDosDont({ type, content, sort_order, is_active });
    res.status(201).json({ success: true, data: row });
  })
);

/**
 * PUT /api/help/dos-donts/:id
 * Update a do/don't item.
 */
router.put(
  '/dos-donts/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ success: false, error: 'Invalid `id`.' });
      return;
    }
    const row = await updateDosDont(id, req.body);
    res.json({ success: true, data: row });
  })
);

/**
 * DELETE /api/help/dos-donts/:id
 * Remove a do/don't item.
 */
router.delete(
  '/dos-donts/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ success: false, error: 'Invalid `id`.' });
      return;
    }
    await deleteDosDont(id);
    res.json({ success: true });
  })
);

// ─── Contact & Support ────────────────────────────────────────────────────────

/**
 * GET /api/help/contact-support
 * List all contact/support entries.
 */
router.get(
  '/contact-support',
  asyncHandler(async (_req: Request, res: Response) => {
    const data = await getAllContactSupport();
    res.json({ success: true, count: data.length, data });
  })
);

/**
 * POST /api/help/contact-support
 * Add a contact/support entry.
 * Body: { label: string; sub_label?: string; icon?: string; url: string; sort_order?: number; is_active?: boolean }
 */
router.post(
  '/contact-support',
  asyncHandler(async (req: Request, res: Response) => {
    const { label, sub_label, icon, url, sort_order, is_active } = req.body as {
      label?: string;
      sub_label?: string;
      icon?: string;
      url?: string;
      sort_order?: number;
      is_active?: boolean;
    };

    if (!label?.trim()) {
      res.status(400).json({ success: false, error: '`label` is required.' });
      return;
    }
    if (!url?.trim()) {
      res.status(400).json({ success: false, error: '`url` is required.' });
      return;
    }

    const row = await insertContactSupport({ label, sub_label, icon, url, sort_order, is_active });
    res.status(201).json({ success: true, data: row });
  })
);

/**
 * PUT /api/help/contact-support/:id
 * Update a contact/support entry.
 */
router.put(
  '/contact-support/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ success: false, error: 'Invalid `id`.' });
      return;
    }
    const row = await updateContactSupport(id, req.body);
    res.json({ success: true, data: row });
  })
);

/**
 * DELETE /api/help/contact-support/:id
 * Remove a contact/support entry.
 */
router.delete(
  '/contact-support/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ success: false, error: 'Invalid `id`.' });
      return;
    }
    await deleteContactSupport(id);
    res.json({ success: true });
  })
);

export default router;
