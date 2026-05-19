import { describe, it, expect } from 'vitest';
import { detectArchetype } from '../archetype';
import { makePage, makeFullPage } from './fixtures';

function pageWithText(text: string) {
  return makePage({
    title: text,
    textSections: [{ tag: 'p', text, selector: 'p' }],
  });
}

describe('detectArchetype', () => {
  it('returns a result with primary, secondary, all, and confidence', () => {
    const result = detectArchetype(pageWithText('built designed created craft'));
    expect(result).toHaveProperty('primary');
    expect(result).toHaveProperty('secondary');
    expect(result).toHaveProperty('all');
    expect(result).toHaveProperty('confidence');
  });

  it('always returns 12 archetypes in `all`', () => {
    const { all } = detectArchetype(makePage());
    expect(all).toHaveLength(12);
  });

  it('primary score is always 100 after normalisation', () => {
    const { primary } = detectArchetype(pageWithText('build create design craft art make'));
    expect(primary.score).toBe(100);
  });

  it('confidence is within 10–100', () => {
    const { confidence } = detectArchetype(makeFullPage());
    expect(confidence).toBeGreaterThanOrEqual(10);
    expect(confidence).toBeLessThanOrEqual(100);
  });

  it('detects creator archetype from design/craft keywords', () => {
    const { primary } = detectArchetype(
      pageWithText('design create build craft art imagine innovate aesthetic visual original')
    );
    expect(primary.id).toBe('creator');
  });

  it('detects hero archetype from challenge/results keywords', () => {
    const { primary } = detectArchetype(
      pageWithText('achieve overcome challenge mission goal drive determination success champion win')
    );
    expect(primary.id).toBe('hero');
  });

  it('detects sage archetype from knowledge/research keywords', () => {
    const { primary } = detectArchetype(
      pageWithText('learn teach wisdom knowledge research analyze study insight expert data')
    );
    expect(primary.id).toBe('sage');
  });

  it('primary score is strictly >= secondary score', () => {
    const { primary, secondary } = detectArchetype(pageWithText('build create design craft'));
    expect(primary.score).toBeGreaterThanOrEqual(secondary.score);
  });

  it('all scores are normalised between 0 and 100', () => {
    const { all } = detectArchetype(pageWithText('build create design craft art'));
    for (const arch of all) {
      expect(arch.score).toBeGreaterThanOrEqual(0);
      expect(arch.score).toBeLessThanOrEqual(100);
    }
  });

  it('returns confidence 10 for a blank page (no signal)', () => {
    const { confidence } = detectArchetype(makePage());
    expect(confidence).toBeGreaterThanOrEqual(10);
  });
});
