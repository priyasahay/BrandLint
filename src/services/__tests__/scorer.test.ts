import { describe, it, expect } from 'vitest';
import { scorePortfolio } from '../scorer';
import { makePage, makeFullPage } from './fixtures';

describe('scorePortfolio', () => {
  it('returns scores bounded 0–100 for an empty page', () => {
    const { scores } = scorePortfolio(makePage());
    for (const val of Object.values(scores)) {
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThanOrEqual(100);
    }
  });

  it('overall is the mean of the five dimensions', () => {
    const { scores } = scorePortfolio(makeFullPage());
    const mean = Math.round(
      (scores.clarity + scores.impact + scores.credibility + scores.attention + scores.actionability) / 5
    );
    expect(scores.overall).toBe(mean);
  });

  it('full page scores higher than empty page on every dimension', () => {
    const { scores: full } = scorePortfolio(makeFullPage());
    const { scores: empty } = scorePortfolio(makePage());
    expect(full.clarity).toBeGreaterThan(empty.clarity);
    expect(full.impact).toBeGreaterThan(empty.impact);
    expect(full.credibility).toBeGreaterThan(empty.credibility);
    expect(full.attention).toBeGreaterThan(empty.attention);
    expect(full.actionability).toBeGreaterThan(empty.actionability);
  });
});

// --- clarity ---
describe('clarity scoring', () => {
  it('awards points for a single H1', () => {
    const with1 = scorePortfolio(makePage({ headings: [{ level: 1, text: 'Hello' }] }));
    const without = scorePortfolio(makePage());
    expect(with1.scores.clarity).toBeGreaterThan(without.scores.clarity);
  });

  it('penalises multiple H1s and emits a warning', () => {
    const { scores, issues } = scorePortfolio(
      makePage({ headings: [{ level: 1, text: 'A' }, { level: 1, text: 'B' }] })
    );
    const singleH1 = scorePortfolio(makePage({ headings: [{ level: 1, text: 'A' }] }));
    expect(scores.clarity).toBeLessThan(singleH1.scores.clarity);
    expect(issues.some(i => i.dimension === 'clarity' && i.severity === 'warning' && /multiple h1/i.test(i.message))).toBe(true);
  });

  it('gives an error when H1 is missing', () => {
    const { issues } = scorePortfolio(makePage());
    expect(issues.some(i => i.dimension === 'clarity' && i.severity === 'error' && /h1/i.test(i.message))).toBe(true);
  });

  it('awards points when a role keyword appears in the title', () => {
    const with_ = scorePortfolio(makePage({ title: 'Jane — Frontend Developer' }));
    const without = scorePortfolio(makePage({ title: 'Jane' }));
    expect(with_.scores.clarity).toBeGreaterThan(without.scores.clarity);
  });
});

// --- impact ---
describe('impact scoring', () => {
  it('awards full impact points for 3+ quantified numbers', () => {
    const rich = makePage({
      textSections: [{ tag: 'p', text: 'Grew revenue 40%, served 10,000 users, reduced cost by 25%', selector: 'p' }],
    });
    const { scores } = scorePortfolio(rich);
    expect(scores.impact).toBeGreaterThanOrEqual(35);
  });

  it('emits an error when no numbers are present', () => {
    const { issues } = scorePortfolio(makePage({
      textSections: [{ tag: 'p', text: 'I worked on many projects and helped the team.', selector: 'p' }],
    }));
    expect(issues.some(i => i.dimension === 'impact' && i.severity === 'error' && /quantified/i.test(i.message))).toBe(true);
  });

  it('penalises task-oriented phrases', () => {
    const taskPage = makePage({
      textSections: [{
        tag: 'p',
        text: 'Responsible for the backend. Worked on the API. Helped with deployment. Assisted with QA.',
        selector: 'p',
      }],
    });
    const cleanPage = makePage({
      textSections: [{ tag: 'p', text: 'Built and shipped the backend API.', selector: 'p' }],
    });
    expect(scorePortfolio(taskPage).scores.impact).toBeLessThan(scorePortfolio(cleanPage).scores.impact);
  });
});

// --- credibility ---
describe('credibility scoring', () => {
  it('awards max social link points for 3+ social links', () => {
    const { scores: many } = scorePortfolio(makePage({ socialLinks: ['https://github.com/x', 'https://linkedin.com/x', 'https://twitter.com/x'] }));
    const { scores: none } = scorePortfolio(makePage({ socialLinks: [] }));
    expect(many.credibility).toBeGreaterThan(none.credibility);
  });

  it('gives bonus points for GitHub link', () => {
    const withGH = scorePortfolio(makePage({ socialLinks: ['https://github.com/x'] }));
    const withOther = scorePortfolio(makePage({ socialLinks: ['https://dribbble.com/x'] }));
    expect(withGH.scores.credibility).toBeGreaterThan(withOther.scores.credibility);
  });

  it('emits an error when no social links exist', () => {
    const { issues } = scorePortfolio(makePage({ socialLinks: [] }));
    expect(issues.some(i => i.dimension === 'credibility' && i.severity === 'error')).toBe(true);
  });

  it('awards testimonial points when present', () => {
    const with_ = scorePortfolio(makePage({ hasTestimonials: true, testimonialCount: 3 }));
    const without = scorePortfolio(makePage({ hasTestimonials: false }));
    expect(with_.scores.credibility).toBeGreaterThan(without.scores.credibility);
  });
});

// --- attention ---
describe('attention scoring', () => {
  it('awards hero section points', () => {
    const with_ = scorePortfolio(makePage({ hasHeroSection: true }));
    const without = scorePortfolio(makePage({ hasHeroSection: false }));
    expect(with_.scores.attention).toBeGreaterThan(without.scores.attention);
  });

  it('awards points for optimal word count (200–2000)', () => {
    const optimal = scorePortfolio(makePage({ wordCount: 600 }));
    const thin = scorePortfolio(makePage({ wordCount: 50 }));
    expect(optimal.scores.attention).toBeGreaterThan(thin.scores.attention);
  });

  it('emits a warning for a thin page', () => {
    const { issues } = scorePortfolio(makePage({ wordCount: 50 }));
    expect(issues.some(i => i.dimension === 'attention' && /words/i.test(i.message))).toBe(true);
  });

  it('emits an error when CTA is missing', () => {
    const { issues } = scorePortfolio(makePage({ hasCTA: false }));
    expect(issues.some(i => i.dimension === 'attention' && i.severity === 'error' && /call-to-action/i.test(i.message))).toBe(true);
  });
});

// --- actionability ---
describe('actionability scoring', () => {
  it('awards points for contact info', () => {
    const with_ = scorePortfolio(makePage({ hasContactInfo: true, contactMethods: ['email'] }));
    const without = scorePortfolio(makePage({ hasContactInfo: false }));
    expect(with_.scores.actionability).toBeGreaterThan(without.scores.actionability);
  });

  it('awards points for a resume link', () => {
    const withResume = makePage({ links: [{ href: '/resume.pdf', text: 'Download Resume', isExternal: false }] });
    const withoutResume = makePage({ links: [] });
    expect(scorePortfolio(withResume).scores.actionability).toBeGreaterThan(scorePortfolio(withoutResume).scores.actionability);
  });

  it('emits an error when no CTAs exist', () => {
    const { issues } = scorePortfolio(makePage({ ctaTexts: [] }));
    expect(issues.some(i => i.dimension === 'actionability' && i.severity === 'error' && /cta/i.test(i.message))).toBe(true);
  });

  it('awards full CTA points for 2+ CTAs', () => {
    const two = scorePortfolio(makePage({ ctaTexts: ['Hire Me', 'Contact'] }));
    const zero = scorePortfolio(makePage({ ctaTexts: [] }));
    expect(two.scores.actionability).toBeGreaterThan(zero.scores.actionability);
  });
});
