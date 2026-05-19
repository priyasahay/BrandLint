# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] — 2026-05-19

### Added

**Core analysis**
- Brand scoring across 5 dimensions: Clarity, Impact, Credibility, Attention, Actionability
- Jungian brand archetype detection across 12 archetypes
- Writing voice fingerprint analysis across 6 dimensions (Rhythm, Richness, Active Voice, Audience Focus, Formality, Consistency)
- Prioritised issues list with errors, warnings, and tips ranked by impact
- Page scraper for any public portfolio or personal site
- Raw HTML analysis endpoint for pages that block automated scraping
- Score history tracking with SQLite and WAL mode
- Score evolution chart for tracking improvement across repeated analyses

**Web dashboard**
- URL input with example chips and instant analysis
- Animated hero with canvas particle network, aurora gradient, and shooting meteors
- Mouse-parallax effect on background glows
- Radar chart and score evolution line chart (Chart.js)
- Tabbed result view: Insights, Issues, Archetype, Voice DNA
- Dark/light mode toggle with localStorage persistence
- Fully responsive layout

**Chrome extension**
- One-click analysis of any page you are browsing
- Popup shows score, dimension bars, top issue, and a link to the full report
- Extension icon matches app branding across all sizes (16, 48, 128px)

**Infrastructure**
- Express + TypeScript backend
- SSRF protection to block requests to private network addresses
- Rate limiting on analysis endpoints (20 requests per minute)
- GitHub Actions CI pipeline for build and test on every push
- Unit test suite with Vitest covering scorer and archetype detection
- SQLite persistence via better-sqlite3

**Documentation**
- README with setup, usage, API reference, and architecture overview
- CONTRIBUTING guide
- SECURITY policy
- CODE_OF_CONDUCT
