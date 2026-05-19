import { scorePortfolio } from './scorer';
import { generateInsights } from './insights';
import { detectArchetype } from './archetype';
import { analyzeVoice } from './voice';
import { saveAnalysis } from './db';
import type { ScrapedPage, AnalysisResult } from '../types';

export function runAnalysis(page: ScrapedPage): AnalysisResult {
  const { scores, issues } = scorePortfolio(page);
  const insights = generateInsights(page, scores, issues);
  const archetype = detectArchetype(page);
  const voice = analyzeVoice(page);

  const result: AnalysisResult = {
    url: page.url,
    scores,
    issues,
    insights,
    scrapedAt: new Date().toISOString(),
    archetype,
    voice,
  };

  saveAnalysis(result);
  return result;
}
