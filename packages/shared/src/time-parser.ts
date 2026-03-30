import type { Locale } from "./types";

export interface TimeRange {
  from?: Date;
  to?: Date;
}

// ---------------------------------------------------------------------------
// Locale-specific time expression patterns
// ---------------------------------------------------------------------------

type ExpressionMatcher = (now: Date) => TimeRange;

const expressions: Record<string, ExpressionMatcher> = {};

function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

function endOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(23, 59, 59, 999);
  return r;
}

function startOfWeek(d: Date): Date {
  const r = new Date(d);
  const day = r.getDay();
  const diff = day === 0 ? 6 : day - 1; // Monday = start of week
  r.setDate(r.getDate() - diff);
  return startOfDay(r);
}

function register(keys: string[], matcher: ExpressionMatcher) {
  for (const key of keys) {
    expressions[key.toLowerCase()] = matcher;
  }
}

// Today
register(["today", "今日", "hoy"], (now) => ({
  from: startOfDay(now),
  to: endOfDay(now),
}));

// Yesterday
register(["yesterday", "昨日", "ayer"], (now) => {
  const d = new Date(now);
  d.setDate(d.getDate() - 1);
  return { from: startOfDay(d), to: endOfDay(d) };
});

// This week
register(["this week", "今週", "esta semana"], (now) => ({
  from: startOfWeek(now),
  to: endOfDay(now),
}));

// Last week
register(["last week", "先週", "semana pasada"], (now) => {
  const thisWeekStart = startOfWeek(now);
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const lastWeekEnd = new Date(thisWeekStart);
  lastWeekEnd.setMilliseconds(-1);
  return { from: lastWeekStart, to: lastWeekEnd };
});

// This month
register(["this month", "今月", "este mes"], (now) => ({
  from: new Date(now.getFullYear(), now.getMonth(), 1),
  to: endOfDay(now),
}));

// Last month
register(["last month", "先月", "mes pasado"], (now) => ({
  from: new Date(now.getFullYear(), now.getMonth() - 1, 1),
  to: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999),
}));

// Last 7 days
register(["last 7 days", "過去7日間", "últimos 7 días"], (now) => {
  const d = new Date(now);
  d.setDate(d.getDate() - 7);
  return { from: startOfDay(d), to: endOfDay(now) };
});

// Last 30 days
register(["last 30 days", "過去30日間", "últimos 30 días"], (now) => {
  const d = new Date(now);
  d.setDate(d.getDate() - 30);
  return { from: startOfDay(d), to: endOfDay(now) };
});

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parse natural-language time expressions from a query string.
 * Returns { from, to } if a known expression is found, or {} otherwise.
 * The `locale` parameter is accepted for API compatibility but all locales
 * are searched simultaneously to maximize matches.
 */
export function parseTimeExpression(query: string, _locale?: Locale): TimeRange {
  const normalized = query.toLowerCase().trim();
  const now = new Date();

  // Try exact match first
  if (expressions[normalized]) {
    return expressions[normalized](now);
  }

  // Try to find expression within the query (longest match first)
  const sortedKeys = Object.keys(expressions).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (normalized.includes(key)) {
      return expressions[key](now);
    }
  }

  return {};
}
