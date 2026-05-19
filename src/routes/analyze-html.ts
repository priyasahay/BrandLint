import { Router, Request, Response } from 'express';
import { parseHtml } from '../services/scraper';
import { runAnalysis } from '../services/analysis';

const router = Router();

router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { html, url } = req.body;

  if (!html || typeof html !== 'string' || !url || typeof url !== 'string') {
    res.status(400).json({ error: 'Both html and url are required' });
    return;
  }

  try {
    const page = parseHtml(html, url);
    res.json(runAnalysis(page));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to analyze HTML';
    res.status(500).json({ error: message });
  }
});

export default router;
