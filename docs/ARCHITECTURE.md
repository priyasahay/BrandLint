# Architecture

This document describes how BrandLint is structured internally.

## Overview

BrandLint is a Node.js/TypeScript application with three layers:

```
┌─────────────────────────────────────────────────────┐
│                    Clients                          │
│   Web UI (public/)    Chrome Extension              │
└──────────────────┬──────────────────────────────────┘
                   │ HTTP
┌──────────────────▼──────────────────────────────────┐
│               Express API (src/index.ts)             │
│                                                      │
│  POST /api/analyze      POST /api/analyze-html       │
│  GET  /api/history      GET  /api/health             │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│               Services (src/services/)               │
│                                                      │
│  scraper.ts    →  fetches and parses pages           │
│  analysis.ts   →  orchestrates the pipeline          │
│  scorer.ts     →  5-dimension brand scoring          │
│  insights.ts   →  rule-based insight text            │
│  archetype.ts  →  Jungian archetype detection        │
│  voice.ts      →  writing style fingerprinting       │
│  db.ts         →  SQLite read/write                  │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│           SQLite (data/brandlint.db)                 │
└─────────────────────────────────────────────────────┘
```

---

## Request Lifecycle

### `POST /api/analyze`

```
Request (url)
    │
    ▼
scraper.ts::scrapePage(url)
    │  axios GET + Cheerio parse
    │  returns ScrapedPage
    ▼
analysis.ts::runAnalysis(page)
    ├── scorer.ts::scorePortfolio(page)      → { scores, issues }
    ├── insights.ts::generateInsights(...)   → RuleInsight
    ├── archetype.ts::detectArchetype(page)  → ArchetypeResult
    ├── voice.ts::analyzeVoice(page)         → VoiceFingerprint
    └── db.ts::saveAnalysis(result)          → persists to SQLite
    │
    ▼
Response (AnalysisResult JSON)
```

### `POST /api/analyze-html`

Identical to the above but the page is obtained via `scraper.ts::parseHtml(html, url)` instead of an HTTP fetch. Used by the Chrome extension to pass the already-loaded DOM.

---

## Data Model

### `ScrapedPage`

The central input to all analysis services. Produced by `scraper.ts`.

```typescript
interface ScrapedPage {
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
```

### `AnalysisResult`

The full output returned to clients and persisted to SQLite.

```typescript
interface AnalysisResult {
  url: string;
  scores: BrandScore;          // { clarity, impact, credibility, attention, actionability, overall }
  issues: BrandIssue[];        // ordered by severity
  insights: RuleInsight;       // { summary, strengths[], improvements[] }
  scrapedAt: string;           // ISO 8601
  archetype?: ArchetypeResult;
  voice?: VoiceFingerprint;
}
```

---

## Scoring Model

Each of the 5 dimensions is scored 0–100 by a dedicated sub-function in `scorer.ts`. The overall score is the arithmetic mean of all 5.

| Dimension | What it measures |
|-----------|-----------------|
| **Clarity** | H1 presence, title length, meta description, role keyword in first sections, bio length |
| **Impact** | Quantified numbers (%, $, user counts), action verbs, avoidance of task-oriented phrases, project headings |
| **Credibility** | Social link count, testimonials, credential keywords, GitHub/LinkedIn presence, profile image |
| **Attention** | Hero section, heading hierarchy depth, image count, CTA presence, word count in optimal range |
| **Actionability** | Contact info, CTA count, internal nav links, social links, resume/CV download link |

---

## Archetype Detection

`archetype.ts` tokenises all page text and counts keyword matches against 12 archetype keyword lists (20 keywords each). Scores are normalised so the top archetype always scores 100. Confidence is calculated as the dominance of the primary archetype over the average of the rest.

---

## Database Schema

```sql
CREATE TABLE analyses (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  url        TEXT NOT NULL,
  scores     TEXT NOT NULL,   -- JSON
  issues     TEXT NOT NULL,   -- JSON
  insights   TEXT NOT NULL,   -- JSON
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_analyses_url ON analyses(url);
```

SQLite runs in WAL mode for better concurrent read performance.

---

## Chrome Extension

The extension (`chrome-extension/`) is a standard Manifest V3 extension:

- **`popup.html` / `popup.js`** — shows the score panel when clicked
- **`manifest.json`** — declares `activeTab` permission and `localhost:3000` host permission

The extension calls the local BrandLint server directly. No cloud relay is involved.
