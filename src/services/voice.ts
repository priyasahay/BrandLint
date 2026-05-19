import type { ScrapedPage, VoiceFingerprint } from '../types.js';

const PASSIVE_PATTERN = /\b(was|were|is|are|been|being)\s+(designed|built|created|developed|used|made|done|responsible|tasked|involved|employed|utilized)\b/gi;
const ACTIVE_VERBS = /\b(built|designed|led|launched|created|developed|scaled|improved|increased|reduced|optimized|delivered|shipped|automated|grew|transformed|achieved|generated|wrote|published|taught|founded|directed)\b/gi;
const STOP_WORDS = new Set(['the','a','an','and','or','but','in','on','at','to','for','of','with','by','from','as','is','was','are','were','be','been','have','has','had','do','does','did','this','that','these','those','it','its','my','your','his','her','our','their','i','you','he','she','we','they','not','so','if','then','than','when','who','what','which','how','all','any','some','more','most','no']);

function splitSentences(text: string): string[] {
  return text
    .replace(/([.!?])\s+/g, '$1\n')
    .split('\n')
    .map(s => s.trim())
    .filter(s => s.length > 10 && /[a-zA-Z]/.test(s));
}

function countWords(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length > 2);
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

function mean(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function analyzeSection(text: string) {
  const sentences = splitSentences(text);
  const words = countWords(text);
  const uniqueWords = new Set(words.filter(w => !STOP_WORDS.has(w)));
  const sentenceLengths = sentences.map(s => s.split(/\s+/).length);
  const iCount = (text.match(/\b(i|my|me|myself)\b/gi) || []).length;
  const youCount = (text.match(/\b(you|your|you're|you'll)\b/gi) || []).length;
  const passiveMatches = (text.match(PASSIVE_PATTERN) || []).length;
  const activeMatches = (text.match(ACTIVE_VERBS) || []).length;
  return { sentences, words, uniqueWords, sentenceLengths, iCount, youCount, passiveMatches, activeMatches };
}

export function analyzeVoice(page: ScrapedPage): VoiceFingerprint {
  const fullText = page.textSections.map(s => s.text).join(' ');

  if (fullText.length < 100) {
    return {
      rhythm: 0, richness: 0, activeVoice: 0,
      audienceFocus: 50, formality: 50, consistency: 0,
      summary: 'Not enough text to analyze voice.',
      details: { avgSentenceLength: 0, sentenceLengthVariance: 0, uniqueWordRatio: 0, youVsIRatio: 0, passiveCount: 0, activeCount: 0, avgWordLength: 0, sectionConsistencyDelta: 0 },
    };
  }

  const full = analyzeSection(fullText);

  // 1. Rhythm — coefficient of variation of sentence lengths (high = varied = engaging)
  const avgSL = mean(full.sentenceLengths);
  const slStdDev = stdDev(full.sentenceLengths);
  const cv = avgSL > 0 ? slStdDev / avgSL : 0;
  const rhythm = Math.min(100, Math.round(cv * 120));

  // 2. Richness — unique meaningful words / total words
  const uniqueRatio = full.words.length > 0 ? full.uniqueWords.size / full.words.length : 0;
  const richness = Math.min(100, Math.round(uniqueRatio * 200));

  // 3. Active Voice — active verbs vs passive constructions
  const totalVoiceSignals = full.activeMatches + full.passiveMatches;
  const activeVoice = totalVoiceSignals > 0
    ? Math.round((full.activeMatches / totalVoiceSignals) * 100)
    : 50;

  // 4. Audience Focus — "you/your" vs "I/my" ratio (high = audience-first = better)
  const totalPronouns = full.iCount + full.youCount;
  const audienceFocus = totalPronouns > 0
    ? Math.round((full.youCount / totalPronouns) * 100)
    : 50;

  // 5. Formality — average word length as a proxy (longer words = more formal)
  const avgWordLength = full.words.length > 0
    ? mean(full.words.map(w => w.length))
    : 5;
  const formality = Math.min(100, Math.round(((avgWordLength - 3) / 5) * 100));

  // 6. Consistency — compare voice between first half and second half of sections
  const mid = Math.floor(page.textSections.length / 2);
  const firstHalf = page.textSections.slice(0, mid).map(s => s.text).join(' ');
  const secondHalf = page.textSections.slice(mid).map(s => s.text).join(' ');
  let consistencyDelta = 0;
  if (firstHalf && secondHalf) {
    const a = analyzeSection(firstHalf);
    const b = analyzeSection(secondHalf);
    const aRL = a.words.length > 0 ? a.uniqueWords.size / a.words.length : 0;
    const bRL = b.words.length > 0 ? b.uniqueWords.size / b.words.length : 0;
    const aTone = a.iCount + a.youCount > 0 ? a.youCount / (a.iCount + a.youCount) : 0.5;
    const bTone = b.iCount + b.youCount > 0 ? b.youCount / (b.iCount + b.youCount) : 0.5;
    consistencyDelta = Math.abs(aRL - bRL) + Math.abs(aTone - bTone);
  }
  const consistency = Math.min(100, Math.round(Math.max(0, 100 - consistencyDelta * 150)));

  // Summary sentence
  const traits: string[] = [];
  if (activeVoice >= 65) traits.push('active and dynamic');
  else if (activeVoice < 35) traits.push('passive in tone');
  if (audienceFocus >= 60) traits.push('audience-focused');
  else if (audienceFocus <= 30) traits.push('self-referential');
  if (richness >= 60) traits.push('vocabulary-rich');
  if (formality >= 65) traits.push('formal');
  else if (formality <= 35) traits.push('conversational');
  if (rhythm >= 60) traits.push('rhythmically varied');
  if (consistency >= 75) traits.push('tonally consistent');
  else if (consistency <= 40) traits.push('inconsistent across sections');

  const summary = traits.length >= 2
    ? `Your brand voice is ${traits.slice(0, 2).join(' and ')}.`
    : traits.length === 1
    ? `Your brand voice is ${traits[0]}.`
    : 'Your brand voice has no strong signal — add more descriptive content.';

  return {
    rhythm, richness, activeVoice, audienceFocus, formality, consistency,
    summary,
    details: {
      avgSentenceLength: Math.round(avgSL),
      sentenceLengthVariance: Math.round(slStdDev),
      uniqueWordRatio: Math.round(uniqueRatio * 100),
      youVsIRatio: totalPronouns > 0 ? Math.round((full.youCount / totalPronouns) * 100) : 50,
      passiveCount: full.passiveMatches,
      activeCount: full.activeMatches,
      avgWordLength: Math.round(avgWordLength * 10) / 10,
      sectionConsistencyDelta: Math.round(consistencyDelta * 100) / 100,
    },
  };
}
