# BrandLint

**Your portfolio says something. Does it say what you think it does?**

You've done the work. Built the projects, shipped the products, grown the skills. But if your portfolio doesn't reflect that clearly, none of it matters to someone seeing you for the first time.

BrandLint helps you close that gap. Point it at any public portfolio or personal site and it shows you exactly how your brand comes across, what's resonating, and what small changes will make the biggest difference.

Paste a URL, get a score across five brand dimensions, discover which of 12 archetypes your writing naturally signals, and walk away with a focused list of things worth fixing. The kind of clarity that usually takes weeks of feedback, in seconds. Runs entirely on your own machine. Nothing gets sent anywhere.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D22-brightgreen)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org)

If you find BrandLint useful, please consider giving it a ⭐ star. It really helps the project grow!

**[Live Preview →](https://priyasahay.github.io/BrandLint/)**

---

## What it does

BrandLint scrapes a public URL, analyses its content, and returns:

| Output | Description |
|--------|-------------|
| **Brand Score** | 0–100 across Clarity, Impact, Credibility, Attention, Actionability |
| **Issues list** | Prioritised errors, warnings, and tips ranked by impact |
| **Brand Archetype** | Which of 12 Jungian archetypes your writing signals |
| **Voice Fingerprint** | 6-dimension writing style analysis (rhythm, richness, active voice, …) |
| **History tracking** | Every analysis persisted locally in SQLite for trend tracking |

---

## Table of Contents

- [Quick Start](#quick-start)
- [Installation](#installation)
- [Configuration](#configuration)
- [Chrome Extension](#chrome-extension)
- [API Reference](#api-reference)
- [Architecture](#architecture)
- [Running Tests](#running-tests)
- [Contributing](#contributing)

---

## Quick Start

```bash
git clone https://github.com/priyasahay/BrandLint.git
cd BrandLint
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), paste a portfolio URL, and hit **Analyze**.

---

## Installation

### Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | ≥ 22 | [Download](https://nodejs.org) |
| npm | ≥ 9 | Bundled with Node |

### Steps

```bash
# 1. Clone
git clone https://github.com/priyasahay/BrandLint.git
cd BrandLint

# 2. Install dependencies
npm install

# 3. Configure environment (optional — defaults work out of the box)
cp .env.example .env

# 4. Start dev server (auto-reloads on file changes)
npm run dev

# 5. Or build and run production
npm run build
npm start
```

The server starts on **port 3000** by default.

---

## Configuration

Copy `.env.example` to `.env` and adjust as needed:

```env
# Server port (default: 3000)
PORT=3000

# SQLite database path (default: ./data/brandlint.db)
DB_PATH=./data/brandlint.db
```

All variables are optional. The app runs with defaults out of the box.

---

## Chrome Extension

The Chrome extension lets you analyse any page you're already browsing with one click — no copying URLs.

### Installation (local / developer mode)

1. Make sure the BrandLint server is running:
   ```bash
   npm run dev
   ```
2. Open **`chrome://extensions`** in Chrome
3. Enable **Developer mode** using the toggle in the top-right corner
4. Click **Load unpacked**
5. Select the `chrome-extension/` folder from the BrandLint project directory
6. The BrandLint icon will appear in your Chrome toolbar

### Using the extension

1. Navigate to any public portfolio or personal website in Chrome
2. Click the **BrandLint icon** in the toolbar
3. The extension sends the page to your local server and displays the full brand analysis in a popup — scores, archetype, issues, and voice fingerprint

### How it works

The extension captures the current page URL and the rendered HTML, then posts it to `http://localhost:3000/api/analyze-html`. The server processes everything locally and returns the result. Nothing is sent to any external server.

> **Note:** The BrandLint server must be running on your machine for the extension to work. If you see a connection error, run `npm run dev` first.

---

## API Reference

See [docs/API.md](docs/API.md) for the full REST API reference.

### Quick reference

```
POST /api/analyze         Scrape and analyse a URL
POST /api/analyze-html    Analyse raw HTML (used by the Chrome extension)
GET  /api/history         Retrieve past analyses
GET  /api/health          Health check
```

---

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for a detailed breakdown of the system.

```
browser / extension
       │
       ▼
 Express API (src/index.ts)
       │
       ├── /api/analyze ──────► scraper.ts ──► analysis.ts
       ├── /api/analyze-html ──► scraper.ts ──► analysis.ts
       └── /api/history ──────────────────────► db.ts
                                    │
                               analysis.ts
                            ┌──────┴───────┐
                         scorer.ts    archetype.ts
                         insights.ts  voice.ts
                                    │
                                   db.ts
                              (SQLite / WAL)
```

---

## Running Tests

```bash
# Run once
npm test

# Watch mode (re-runs on file save)
npm run test:watch
```

Tests cover the core scoring and archetype detection logic. See [src/services/\_\_tests\_\_/](src/services/__tests__/) for the test files.

---

## Maintainers

- [priyasahay](https://github.com/priyasahay) — Creator & Maintainer

---

## Contributors

A big thank you to all our contributors! 🎉

[![Contributors](https://contrib.rocks/image?repo=priyasahay/BrandLint)](https://github.com/priyasahay/BrandLint/graphs/contributors)

---

## Contributing

We welcome contributions! Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a PR.

**Quick guide:**

```bash
# Fork the repo, then:
git checkout -b feat/your-feature
npm install
npm run dev          # develop
npm test             # make sure tests pass
npm run build        # make sure it compiles
# open a PR
```

---
