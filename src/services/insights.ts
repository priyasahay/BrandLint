import type { BrandScore, BrandIssue, RuleInsight, ScrapedPage } from '../types';

const DIM_LABELS: Record<string, string> = {
  clarity: 'Clarity',
  impact: 'Impact',
  credibility: 'Credibility',
  attention: 'Attention',
  actionability: 'Actionability',
};

const STRENGTH_MSGS: Record<string, string[]> = {
  clarity:       ['Your identity and role are clearly communicated', 'Visitors quickly understand who you are and what you do'],
  impact:        ['You showcase measurable results and achievements', 'Your work is backed by concrete numbers and outcomes'],
  credibility:   ['Strong social proof — links, testimonials, or endorsements present', 'Your professional presence builds trust effectively'],
  attention:     ['Good visual structure keeps visitors engaged', 'Well-organised headings and content aid scannability'],
  actionability: ['Clear calls-to-action make it easy to reach you', 'Visitors have a clear next step — hire, contact, or connect'],
};

const IMPROVE_MSGS: Record<string, string[]> = {
  clarity:       ['Sharpen your headline — state your role and niche in one sentence', 'Add a tagline that captures your unique value in under 10 words'],
  impact:        ['Add numbers to your achievements (%, users, revenue, time saved)', 'Show 2–3 specific outcomes from your best projects'],
  credibility:   ['Link to your GitHub, LinkedIn, or other professional profiles', 'Add a testimonial or endorsement to build social proof'],
  attention:     ['Break long sections into scannable headings and bullets', 'Add a professional photo — pages with photos get more engagement'],
  actionability: ['Add a visible "Hire Me" or "Contact" button above the fold', 'Include your email or a contact form so visitors can reach you easily'],
};

export function generateInsights(page: ScrapedPage, scores: BrandScore, issues: BrandIssue[]): RuleInsight {
  const dims = ['clarity', 'impact', 'credibility', 'attention', 'actionability'] as const;

  const sorted = [...dims].sort((a, b) => scores[b] - scores[a]);
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];

  const summary = buildSummary(scores.overall, strongest, weakest, scores);

  const strengths: string[] = [];
  for (const dim of sorted.slice(0, 3)) {
    if (scores[dim] >= 60) {
      const msgs = STRENGTH_MSGS[dim];
      strengths.push(msgs[strengths.length % msgs.length]);
    }
  }
  if (!strengths.length) strengths.push('You have a starting point — small fixes below will improve your score quickly');

  const improvements: string[] = [];
  const errorDims = [...new Set(issues.filter(i => i.severity === 'error').map(i => i.dimension))];
  const warningDims = [...new Set(issues.filter(i => i.severity === 'warning').map(i => i.dimension))];
  const priorityDims = [...errorDims, ...warningDims].slice(0, 3);

  for (const dim of priorityDims) {
    const msgs = IMPROVE_MSGS[dim];
    if (msgs) improvements.push(msgs[improvements.length % msgs.length]);
  }

  if (improvements.length < 2) {
    const lowestDims = sorted.slice(-2).reverse();
    for (const dim of lowestDims) {
      if (!priorityDims.includes(dim)) {
        const msgs = IMPROVE_MSGS[dim];
        if (msgs) improvements.push(msgs[0]);
        if (improvements.length >= 3) break;
      }
    }
  }

  return { summary, strengths, improvements };
}

function buildSummary(overall: number, strongest: string, weakest: string, scores: BrandScore): string {
  const grade = overall >= 80 ? 'strong' : overall >= 60 ? 'solid' : overall >= 40 ? 'developing' : 'early-stage';
  const strongLabel = DIM_LABELS[strongest];
  const weakLabel = DIM_LABELS[weakest];
  const weakScore = scores[weakest as keyof BrandScore] as number;

  if (overall >= 80) {
    return `Your personal brand is ${grade} at ${overall}/100. ${strongLabel} is your standout dimension. Keep iterating — even small improvements to ${weakLabel} (${weakScore}) can push you to the top tier.`;
  }
  if (overall >= 60) {
    return `Your brand scores ${overall}/100 — a ${grade} foundation. ${strongLabel} is working well for you. The biggest opportunity is ${weakLabel} (${weakScore}), where targeted fixes can noticeably lift your overall score.`;
  }
  if (overall >= 40) {
    return `Your brand is ${grade} at ${overall}/100. You have the basics in place — ${strongLabel} leads your dimensions. Prioritise fixing ${weakLabel} (${weakScore}) first; it has the highest impact on your score.`;
  }
  return `Your brand is at ${overall}/100 — there's significant room to grow. Start with the errors below; each one directly lowers your score. ${weakLabel} (${weakScore}) needs the most attention.`;
}
