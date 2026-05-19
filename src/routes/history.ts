import { Router, Request, Response } from 'express';
import { getAllHistory, getHistory } from '../services/db';

const router = Router();

router.get('/', (_req: Request, res: Response): void => {
  const entries = getAllHistory();
  res.json(entries);
});

router.get('/:url', (req: Request<{ url: string }>, res: Response): void => {
  const url = decodeURIComponent(req.params.url);
  const entries = getHistory(url);
  res.json(entries);
});

export default router;
