import type { ScrapedPage, ArchetypeResult, ArchetypeScore } from '../types.js';

const ARCHETYPES: Record<string, {
  name: string; tagline: string; emoji: string;
  description: string; brandTraits: string[]; keywords: string[];
}> = {
  hero: {
    name: 'The Hero', emoji: '⚡',
    tagline: 'Driven by challenge, defined by results',
    description: 'You position yourself as someone who overcomes challenges and delivers results. Your brand speaks to achievement, determination, and measurable impact.',
    brandTraits: ['Results-oriented', 'High energy', 'Achievement-focused'],
    keywords: ['achieve', 'overcome', 'challenge', 'mission', 'goal', 'drive', 'determination', 'success', 'champion', 'solve', 'problem', 'win', 'courage', 'strength', 'accomplish', 'impact', 'results', 'performance', 'deliver', 'execute'],
  },
  sage: {
    name: 'The Sage', emoji: '🎓',
    tagline: 'Authority through knowledge and insight',
    description: 'You lead with expertise and intellectual depth. Your brand signals trust through demonstrated knowledge, research, and analytical thinking.',
    brandTraits: ['Knowledge authority', 'Analytical', 'Trusted expert'],
    keywords: ['learn', 'teach', 'wisdom', 'knowledge', 'research', 'analyze', 'study', 'insight', 'expert', 'data', 'understand', 'discover', 'science', 'intelligence', 'inform', 'educate', 'thought', 'theory', 'evidence', 'framework'],
  },
  creator: {
    name: 'The Creator', emoji: '🎨',
    tagline: 'Craft, originality, and aesthetic vision',
    description: 'You are defined by your creative output. Your brand is about making things — whether code, design, writing, or art — with craft and intentionality.',
    brandTraits: ['Craft-focused', 'Visually expressive', 'Original thinker'],
    keywords: ['design', 'create', 'build', 'craft', 'art', 'imagine', 'innovate', 'aesthetic', 'visual', 'style', 'original', 'creative', 'express', 'beautiful', 'develop', 'engineer', 'make', 'portfolio', 'produce', 'shape'],
  },
  explorer: {
    name: 'The Explorer', emoji: '🧭',
    tagline: 'Curiosity, discovery, and new frontiers',
    description: 'You embrace the unknown. Your brand communicates curiosity, adaptability, and an appetite for tackling new problems in new ways.',
    brandTraits: ['Curious', 'Adaptable', 'Innovation-driven'],
    keywords: ['discover', 'explore', 'journey', 'adventure', 'new', 'frontier', 'curious', 'world', 'change', 'different', 'experience', 'open', 'possibilities', 'pioneer', 'venture', 'independent', 'diverse', 'test', 'experiment', 'iterate'],
  },
  rebel: {
    name: 'The Rebel', emoji: '🔥',
    tagline: 'Challenging conventions, rewriting rules',
    description: 'You position yourself as someone who questions the status quo. Your brand challenges conventional thinking and signals bold, unconventional approaches.',
    brandTraits: ['Disruptive', 'Bold', 'Unconventional thinker'],
    keywords: ['disrupt', 'challenge', 'break', 'unconventional', 'rebel', 'revolution', 'question', 'bold', 'alternative', 'radical', 'rethink', 'innovative', 'maverick', 'defy', 'push', 'different', 'status', 'against', 'norm', 'paradigm'],
  },
  caregiver: {
    name: 'The Caregiver', emoji: '🤝',
    tagline: 'Making others successful is the mission',
    description: 'You lead with impact on others. Your brand is oriented around helping, supporting, and making a difference in your community or users.',
    brandTraits: ['People-first', 'Mission-driven', 'Collaborative'],
    keywords: ['help', 'support', 'care', 'community', 'people', 'impact', 'service', 'give', 'empower', 'together', 'collaborate', 'others', 'team', 'nurture', 'serve', 'mission', 'purpose', 'better', 'improve', 'social'],
  },
  ruler: {
    name: 'The Ruler', emoji: '👑',
    tagline: 'Leadership, vision, and commanding presence',
    description: 'You signal authority and leadership. Your brand communicates that you set direction, make decisions, and take ownership at the highest level.',
    brandTraits: ['Leadership presence', 'Strategic', 'Executive-level'],
    keywords: ['lead', 'manage', 'authority', 'organize', 'direct', 'executive', 'strategy', 'vision', 'command', 'responsibility', 'guide', 'decision', 'stakeholder', 'founder', 'director', 'head', 'chief', 'govern', 'oversee', 'architect'],
  },
  magician: {
    name: 'The Magician', emoji: '✨',
    tagline: 'Turning vision into reality through transformation',
    description: 'You are a catalyst. Your brand signals transformation — taking a problem or vision and making something new and better emerge from it.',
    brandTraits: ['Transformative', 'Visionary', 'Catalyst for change'],
    keywords: ['transform', 'vision', 'dream', 'inspire', 'imagine', 'possibility', 'future', 'potential', 'catalyst', 'breakthrough', 'reinvent', 'innovate', 'bridge', 'connect', 'evolve', 'emerge', 'shift', 'reshape', 'generate', 'spark'],
  },
  everyman: {
    name: 'The Everyman', emoji: '🌱',
    tagline: 'Authentic, approachable, and reliable',
    description: 'You lead with authenticity and relatability. Your brand communicates that you are real, trustworthy, and genuinely accessible.',
    brandTraits: ['Authentic', 'Trustworthy', 'Approachable'],
    keywords: ['real', 'practical', 'honest', 'simple', 'reliable', 'trust', 'community', 'belong', 'straightforward', 'genuine', 'authentic', 'approachable', 'friendly', 'humble', 'accessible', 'open', 'transparent', 'consistent', 'down', 'everyday'],
  },
  jester: {
    name: 'The Jester', emoji: '🎭',
    tagline: 'Energy, wit, and a lighter touch',
    description: 'You bring lightness to serious work. Your brand uses humor, energy, and personality to stand out and make interactions memorable.',
    brandTraits: ['High energy', 'Memorable personality', 'Witty communicator'],
    keywords: ['fun', 'play', 'enjoy', 'laugh', 'humor', 'spontaneous', 'entertain', 'joy', 'celebrate', 'vibrant', 'witty', 'quirky', 'playful', 'exciting', 'lively', 'energetic', 'creative', 'bold', 'entertaining', 'lighthearted'],
  },
  lover: {
    name: 'The Lover', emoji: '❤️',
    tagline: 'Deep passion and meaningful connection',
    description: 'You lead with passion and emotional depth. Your brand signals that you care deeply about your craft and the connections you build through your work.',
    brandTraits: ['Passionate', 'Deep connector', 'Craft devotion'],
    keywords: ['passion', 'love', 'beauty', 'connection', 'relationship', 'feel', 'desire', 'dedicate', 'devoted', 'heart', 'inspire', 'meaningful', 'emotional', 'aesthetic', 'experience', 'deep', 'authentic', 'soul', 'invest', 'immerse'],
  },
  innocent: {
    name: 'The Innocent', emoji: '🌟',
    tagline: 'Optimism, simplicity, and genuine goodness',
    description: 'You signal clarity and optimism. Your brand communicates that the work you do is good, simple, and genuinely positive in its impact.',
    brandTraits: ['Optimistic', 'Clear communicator', 'Genuinely good'],
    keywords: ['simple', 'pure', 'honest', 'good', 'positive', 'hope', 'joy', 'trust', 'natural', 'free', 'safe', 'dream', 'optimistic', 'happy', 'clear', 'fresh', 'open', 'sincere', 'light', 'clean'],
  },
};

function matchesKeyword(word: string, keyword: string): boolean {
  const w = word.replace(/[^a-z]/g, '');
  const k = keyword.replace(/[^a-z]/g, '');
  if (w.length < 3 || k.length < 3) return w === k;
  return w === k || (k.length >= 5 && w.startsWith(k));
}

export function detectArchetype(page: ScrapedPage): ArchetypeResult {
  const allText = [
    page.title,
    page.metaDescription,
    ...page.headings.map(h => h.text),
    ...page.textSections.map(s => s.text),
    ...page.ctaTexts,
  ].join(' ').toLowerCase();

  const words = allText.split(/\s+/);

  const scores: ArchetypeScore[] = Object.entries(ARCHETYPES).map(([id, arch]) => {
    let matchCount = 0;
    for (const keyword of arch.keywords) {
      if (words.some(w => matchesKeyword(w, keyword))) matchCount++;
    }
    const rawScore = Math.round((matchCount / arch.keywords.length) * 100);
    return { id, name: arch.name, tagline: arch.tagline, emoji: arch.emoji, description: arch.description, brandTraits: arch.brandTraits, score: rawScore, matchCount };
  });

  scores.sort((a, b) => b.score - a.score);

  // Normalize so primary = 100
  const topScore = scores[0]?.score || 1;
  const normalized = scores.map(s => ({
    ...s,
    score: topScore > 0 ? Math.round((s.score / topScore) * 100) : 0,
  }));

  const primary = normalized[0];
  const secondary = normalized[1];

  // Confidence: how dominant primary is vs the field
  const avgOthers = normalized.slice(1).reduce((sum, s) => sum + s.score, 0) / (normalized.length - 1);
  const dominance = primary.score - avgOthers;
  const confidence = Math.min(100, Math.max(10, Math.round(dominance)));

  return { primary, secondary, all: normalized, confidence };
}
