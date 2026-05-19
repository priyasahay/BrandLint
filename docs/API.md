# API Reference

Base URL: `http://localhost:3000` (default)

All request bodies are JSON. All responses are JSON.

---

## Endpoints

### `GET /api/health`

Health check.

**Response `200`**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:00:00.000Z"
}
```

---

### `POST /api/analyze`

Scrape a public URL and return a full brand analysis.

**Request body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `url` | string | ✅ | Any publicly accessible URL |

```json
{ "url": "https://yourname.dev" }
```

**Response `200`** — `AnalysisResult`

```json
{
  "url": "https://yourname.dev",
  "scrapedAt": "2024-01-15T10:00:00.000Z",
  "scores": {
    "clarity": 75,
    "impact": 60,
    "credibility": 80,
    "attention": 55,
    "actionability": 70,
    "overall": 68
  },
  "issues": [
    {
      "dimension": "attention",
      "severity": "error",
      "message": "No call-to-action found above the fold — add a clear CTA like \"Hire Me\"",
      "selector": "header, [class*=\"hero\"]",
      "section": "hero"
    }
  ],
  "insights": {
    "summary": "Strong credibility and clarity but needs a clear call-to-action.",
    "strengths": ["Professional profile photo detected", "3 social links found"],
    "improvements": ["Add a CTA in the hero section", "Quantify achievements with numbers"]
  },
  "archetype": {
    "primary": {
      "id": "creator",
      "name": "The Creator",
      "emoji": "🎨",
      "tagline": "Craft, originality, and aesthetic vision",
      "score": 100,
      "matchCount": 12,
      "brandTraits": ["Craft-focused", "Visually expressive", "Original thinker"],
      "description": "..."
    },
    "secondary": { "..." },
    "all": [ "..." ],
    "confidence": 42
  },
  "voice": {
    "rhythm": 70,
    "richness": 85,
    "activeVoice": 60,
    "audienceFocus": 75,
    "formality": 55,
    "consistency": 80,
    "summary": "Your brand voice is vocabulary-rich and audience-focused.",
    "details": { "..." }
  }
}
```

**Error responses**

| Status | Condition |
|--------|-----------|
| `400` | `url` missing or not a string, or host unreachable |
| `403` | Site actively blocks automated access (LinkedIn, Facebook, etc.) |
| `408` | Site timed out |
| `502` | Site returned an HTTP error |
| `500` | Unexpected server error |

---

### `POST /api/analyze-html`

Analyse raw HTML without fetching it (used by the Chrome extension which passes the live DOM).

**Request body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `html` | string | ✅ | Full HTML of the page |
| `url` | string | ✅ | Original URL (used for saving history) |

```json
{
  "html": "<!DOCTYPE html><html>...</html>",
  "url": "https://yourname.dev"
}
```

**Response `200`** — same `AnalysisResult` shape as `/api/analyze`

**Error responses**

| Status | Condition |
|--------|-----------|
| `400` | `html` or `url` missing |
| `500` | Parse or analysis error |

---

### `GET /api/history`

Return all past analyses ordered by most recent first (max 100).

**Query parameters**

| Param | Type | Description |
|-------|------|-------------|
| `url` | string | *(optional)* Filter to a specific URL |

**Examples**
```
GET /api/history
GET /api/history?url=https://yourname.dev
```

**Response `200`**

```json
[
  {
    "id": 42,
    "url": "https://yourname.dev",
    "scores": { "clarity": 75, "..." },
    "issues": [ "..." ],
    "insights": { "..." },
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
]
```

---

## Severity Levels

Issues returned by the API use three severity levels:

| Level | Meaning |
|-------|---------|
| `error` | Significant gap that meaningfully reduces the score — fix first |
| `warning` | Moderate issue worth addressing in the next iteration |
| `info` | Low-priority tip for further improvement |

---

## Score Dimensions

| Dimension | Range | What drives it |
|-----------|-------|---------------|
| `clarity` | 0–100 | H1, title, meta description, role keywords, bio length |
| `impact` | 0–100 | Quantified numbers, action verbs, project headings |
| `credibility` | 0–100 | Social links, testimonials, credentials, profile photo |
| `attention` | 0–100 | Hero section, heading hierarchy, images, CTA, word count |
| `actionability` | 0–100 | Contact info, CTA count, nav links, resume link |
| `overall` | 0–100 | Arithmetic mean of all five |
