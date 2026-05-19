# Contributing to BrandLint

Thank you for your interest in contributing! This document covers everything you need to get started.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Branching & Commits](#branching--commits)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Requesting Features](#requesting-features)
- [Style Guide](#style-guide)

---

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating you agree to uphold it.

---

## How to Contribute

There are many ways to help:

- 🐛 **Bug reports** — open an issue with the bug report template
- 💡 **Feature requests** — open an issue with the feature request template
- 📝 **Documentation** — fix typos, improve clarity, add examples
- 🧪 **Tests** — add missing test coverage
- 🔧 **Code** — fix bugs or implement features from the issue tracker

---

## Development Setup

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9

### Steps

```bash
# 1. Fork the repo on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/brandlint.git
cd brandlint

# 2. Add the upstream remote
git remote add upstream https://github.com/original-owner/brandlint.git

# 3. Install dependencies
npm install

# 4. Start the dev server
npm run dev

# 5. In a separate terminal, run tests in watch mode
npm run test:watch
```

---

## Project Structure

```
brandlint/
├── src/
│   ├── index.ts              # Express server entry point
│   ├── config.ts             # Environment configuration
│   ├── types.ts              # Shared TypeScript types
│   ├── routes/
│   │   ├── analyze.ts        # POST /api/analyze (scrape by URL)
│   │   ├── analyze-html.ts   # POST /api/analyze-html (raw HTML)
│   │   └── history.ts        # GET /api/history
│   └── services/
│       ├── analysis.ts       # Shared analysis pipeline
│       ├── scraper.ts        # Page scraping & HTML parsing
│       ├── scorer.ts         # Brand scoring (5 dimensions)
│       ├── insights.ts       # Rule-based insight generation
│       ├── archetype.ts      # Jungian archetype detection
│       ├── voice.ts          # Writing voice fingerprinting
│       ├── db.ts             # SQLite persistence
│       └── __tests__/        # Unit tests
├── public/                   # Frontend (HTML/CSS/JS)
├── chrome-extension/         # Chrome extension source
├── data/                     # SQLite database (gitignored)
├── .github/
│   ├── workflows/ci.yml      # CI pipeline
│   └── ISSUE_TEMPLATE/       # Issue templates
└── docs/                     # Extended documentation
```

---

## Branching & Commits

### Branch naming

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feat/short-description` | `feat/voice-score-chart` |
| Bug fix | `fix/short-description` | `fix/scraper-timeout` |
| Docs | `docs/short-description` | `docs/api-reference` |
| Refactor | `refactor/short-description` | `refactor/route-helpers` |
| Test | `test/short-description` | `test/scorer-edge-cases` |

### Commit messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>: <short summary>

[optional body]
```

**Types:** `feat`, `fix`, `docs`, `test`, `refactor`, `chore`

**Examples:**
```
feat: add voice consistency scoring
fix: handle sites that return 999 status
docs: add API reference for /api/history
test: cover negative clarity score edge case
```

---

## Pull Request Process

1. **Keep PRs focused** — one feature or fix per PR
2. **Write tests** for new logic in `src/services/`
3. **Ensure CI passes** — `npm test` and `npm run build` must both succeed
4. **Update docs** if you're adding or changing behaviour
5. **Fill in the PR template** — describe what changed and why
6. Request a review — a maintainer will respond within a few days

### Checklist before opening a PR

- [ ] `npm test` passes locally
- [ ] `npm run build` compiles without errors
- [ ] New public functions have clear, self-explaining names
- [ ] No new `console.log` left in production code paths
- [ ] PR description explains *why*, not just *what*

---

## Reporting Bugs

Use the **Bug Report** issue template. Include:

- BrandLint version (or commit SHA)
- Node.js version (`node --version`)
- Steps to reproduce
- Expected vs actual behaviour
- Any relevant error output

---

## Requesting Features

Use the **Feature Request** issue template. Explain:

- The problem you're trying to solve
- Your proposed solution (optional)
- Alternatives you've considered

---

## Style Guide

- **TypeScript** — strict mode is on; avoid `any` unless unavoidable
- **No comments** unless the *why* is non-obvious
- **No unused imports** — the TypeScript compiler will catch them
- **Prefer `const`** over `let`; avoid `var`
- **Functions over classes** for services — keeps things simple and testable
