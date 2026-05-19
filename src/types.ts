export interface BrandScore {
  clarity: number;
  impact: number;
  credibility: number;
  attention: number;
  actionability: number;
  overall: number;
}

export type IssueSeverity = 'error' | 'warning' | 'info';

export interface BrandIssue {
  dimension: keyof Omit<BrandScore, 'overall'>;
  severity: IssueSeverity;
  message: string;
  selector?: string;
  section?: string;
}

export interface ScrapedPage {
  url: string;
  title: string;
  metaDescription: string;
  headings: { level: number; text: string }[];
  links: { href: string; text: string; isExternal: boolean }[];
  images: { src: string; alt: string }[];
  socialLinks: string[];
  textSections: { tag: string; text: string; selector: string }[];
  hasCTA: boolean;
  ctaTexts: string[];
  hasContactInfo: boolean;
  contactMethods: string[];
  hasTestimonials: boolean;
  testimonialCount: number;
  hasHeroSection: boolean;
  wordCount: number;
  rawText: string;
}

export interface RuleInsight {
  summary: string;
  strengths: string[];
  improvements: string[];
}

export interface AnalysisResult {
  url: string;
  scores: BrandScore;
  issues: BrandIssue[];
  insights: RuleInsight;
  scrapedAt: string;
  archetype?: ArchetypeResult;
  voice?: VoiceFingerprint;
}

// --- Archetype Detection ---
export interface ArchetypeScore {
  id: string;
  name: string;
  tagline: string;
  emoji: string;
  description: string;
  brandTraits: string[];
  score: number;
  matchCount: number;
}

export interface ArchetypeResult {
  primary: ArchetypeScore;
  secondary: ArchetypeScore;
  all: ArchetypeScore[];
  confidence: number;
}

// --- Voice Fingerprint ---
export interface VoiceFingerprint {
  rhythm: number;
  richness: number;
  activeVoice: number;
  audienceFocus: number;
  formality: number;
  consistency: number;
  summary: string;
  details: {
    avgSentenceLength: number;
    sentenceLengthVariance: number;
    uniqueWordRatio: number;
    youVsIRatio: number;
    passiveCount: number;
    activeCount: number;
    avgWordLength: number;
    sectionConsistencyDelta: number;
  };
}

export interface HistoryEntry {
  id: number;
  url: string;
  scores: BrandScore;
  issues: BrandIssue[];
  insights: RuleInsight;
  createdAt: string;
}
