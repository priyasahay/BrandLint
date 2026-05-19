import { Router, Request, Response } from 'express';
import { scrapePage, ScrapeBlockedError } from '../services/scraper';
import { runAnalysis } from '../services/analysis';

const BLOCKED_SUGGESTIONS: Record<string, string> = {
  'linkedin.com': 'LinkedIn blocks automated access. Try exporting your profile as a PDF and hosting it, or use your personal portfolio site instead.',
  'facebook.com': 'Facebook blocks automated access. Use your personal portfolio site instead.',
  'instagram.com': 'Instagram blocks automated access. Use your personal portfolio site instead.',
};

function getBlockedMessage(hostname: string, statusCode: number): string {
  for (const [domain, suggestion] of Object.entries(BLOCKED_SUGGESTIONS)) {
    if (hostname.includes(domain)) return suggestion;
  }
  return `${hostname} returned status ${statusCode} and is blocking automated access. This typically means the site requires login or uses anti-bot protection. Try analyzing a publicly accessible portfolio site instead.`;
}

const router = Router();

router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { url } = req.body;

  if (!url || typeof url !== 'string') {
    res.status(400).json({ error: 'URL is required' });
    return;
  }

  try {
    const page = await scrapePage(url);
    res.json(runAnalysis(page));
  } catch (err) {
    if (err instanceof ScrapeBlockedError) {
      res.status(403).json({ error: getBlockedMessage(err.hostname, err.statusCode) });
      return;
    }
    const message = err instanceof Error ? err.message : 'Failed to analyze URL';
    if (message.includes('ENOTFOUND') || message.includes('ECONNREFUSED')) {
      res.status(400).json({ error: `Could not reach URL: ${url}` });
    } else if (message.includes('timeout')) {
      res.status(408).json({ error: 'Request timed out — the site took too long to respond' });
    } else if (message.includes('status code')) {
      res.status(502).json({ error: `The site returned an error. It may require login or block automated access. Try a public portfolio URL.` });
    } else {
      res.status(500).json({ error: message });
    }
  }
});

export default router;
