import express from 'express';
import cors from 'cors';
import path from 'path';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import analyzeRouter from './routes/analyze';
import analyzeHtmlRouter from './routes/analyze-html';
import historyRouter from './routes/history';

const app = express();

const analyzeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: 'Too many requests — please wait a minute before trying again' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(cors());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api/analyze', analyzeLimiter, express.json({ limit: '2kb' }), analyzeRouter);
app.use('/api/analyze-html', analyzeLimiter, express.json({ limit: '10mb' }), analyzeHtmlRouter);
app.use('/api/history', express.json(), historyRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(config.port, () => {
  console.log(`BrandLint running at http://localhost:${config.port}`);
});
