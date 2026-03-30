// =============================================================================
// SHOGUN Desktop — Local SQLite Buffer
// =============================================================================

import { app } from "electron";
import Database from "better-sqlite3";
import * as path from "node:path";
import type { MemorySource } from "@shogun/shared";

export interface CaptureRow {
  id: number;
  source: MemorySource;
  content: string;
  app_name: string;
  window_title: string;
  captured_at: string;
  synced: number;
}

export interface StoreStats {
  total: number;
  unsynced: number;
  today: number;
}

let db: Database.Database | null = null;

export function initStore(): void {
  const dbPath = path.join(app.getPath("userData"), "captures.db");
  db = new Database(dbPath);

  db.pragma("journal_mode = WAL");
  db.pragma("busy_timeout = 5000");

  db.exec(`
    CREATE TABLE IF NOT EXISTS captures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source TEXT NOT NULL,
      content TEXT NOT NULL,
      app_name TEXT NOT NULL DEFAULT '',
      window_title TEXT NOT NULL DEFAULT '',
      captured_at TEXT NOT NULL,
      synced INTEGER NOT NULL DEFAULT 0
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_captures_synced ON captures(synced);
    CREATE INDEX IF NOT EXISTS idx_captures_captured_at ON captures(captured_at);
  `);
}

function getDb(): Database.Database {
  if (!db) {
    throw new Error("[store] Database not initialized. Call initStore() first.");
  }
  return db;
}

export function insert(entry: {
  source: MemorySource;
  content: string;
  appName: string;
  windowTitle: string;
}): number {
  const stmt = getDb().prepare(`
    INSERT INTO captures (source, content, app_name, window_title, captured_at, synced)
    VALUES (?, ?, ?, ?, ?, 0)
  `);
  const result = stmt.run(
    entry.source,
    entry.content,
    entry.appName,
    entry.windowTitle,
    new Date().toISOString(),
  );
  return Number(result.lastInsertRowid);
}

export function getUnsynced(limit: number = 50): CaptureRow[] {
  const stmt = getDb().prepare(`
    SELECT * FROM captures WHERE synced = 0 ORDER BY captured_at ASC LIMIT ?
  `);
  return stmt.all(limit) as CaptureRow[];
}

export function markSynced(ids: number[]): void {
  if (ids.length === 0) return;
  const placeholders = ids.map(() => "?").join(",");
  const stmt = getDb().prepare(
    `UPDATE captures SET synced = 1 WHERE id IN (${placeholders})`,
  );
  stmt.run(...ids);
}

export function deleteOld(days: number): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const stmt = getDb().prepare(`
    DELETE FROM captures WHERE synced = 1 AND captured_at < ?
  `);
  const result = stmt.run(cutoff.toISOString());
  return result.changes;
}

export function getStats(): StoreStats {
  const d = getDb();

  const totalRow = d.prepare("SELECT COUNT(*) as count FROM captures").get() as
    | { count: number }
    | undefined;
  const unsyncedRow = d
    .prepare("SELECT COUNT(*) as count FROM captures WHERE synced = 0")
    .get() as { count: number } | undefined;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayRow = d
    .prepare(
      "SELECT COUNT(*) as count FROM captures WHERE captured_at >= ?",
    )
    .get(todayStart.toISOString()) as { count: number } | undefined;

  return {
    total: totalRow?.count ?? 0,
    unsynced: unsyncedRow?.count ?? 0,
    today: todayRow?.count ?? 0,
  };
}

export function closeStore(): void {
  if (db) {
    db.close();
    db = null;
  }
}
