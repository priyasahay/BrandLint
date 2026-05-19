import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { config } from '../config';
import type { AnalysisResult, HistoryEntry, BrandScore, BrandIssue, RuleInsight } from '../types';

const dbDir = path.dirname(config.db.path);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(config.db.path);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS analyses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL,
    scores TEXT NOT NULL,
    issues TEXT NOT NULL,
    insights TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

db.exec(`CREATE INDEX IF NOT EXISTS idx_analyses_url ON analyses(url)`);

const insertStmt = db.prepare(`
  INSERT INTO analyses (url, scores, issues, insights, created_at)
  VALUES (?, ?, ?, ?, ?)
`);

const getByUrlStmt = db.prepare(`
  SELECT * FROM analyses WHERE url = ? ORDER BY created_at DESC
`);

const getAllStmt = db.prepare(`
  SELECT * FROM analyses ORDER BY created_at DESC LIMIT 100
`);

export function saveAnalysis(result: AnalysisResult): number {
  const info = insertStmt.run(
    result.url,
    JSON.stringify(result.scores),
    JSON.stringify(result.issues),
    JSON.stringify(result.insights),
    result.scrapedAt
  );
  return info.lastInsertRowid as number;
}

function rowToEntry(row: any): HistoryEntry {
  return {
    id: row.id,
    url: row.url,
    scores: JSON.parse(row.scores) as BrandScore,
    issues: JSON.parse(row.issues) as BrandIssue[],
    insights: JSON.parse(row.insights) as RuleInsight,
    createdAt: row.created_at,
  };
}

export function getHistory(url: string): HistoryEntry[] {
  return getByUrlStmt.all(url).map(rowToEntry);
}

export function getAllHistory(): HistoryEntry[] {
  return getAllStmt.all().map(rowToEntry);
}

export function closeDb(): void {
  db.close();
}
