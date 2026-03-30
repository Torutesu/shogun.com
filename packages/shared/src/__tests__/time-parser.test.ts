import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { parseTimeExpression, type TimeRange } from "../time-parser";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Fix "now" to a known date so assertions are deterministic. */
const FIXED_NOW = new Date("2026-03-30T14:30:00.000Z");

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

function expectRange(range: TimeRange): void {
  expect(range.from).toBeInstanceOf(Date);
  expect(range.to).toBeInstanceOf(Date);
  expect(range.from!.getTime()).toBeLessThanOrEqual(range.to!.getTime());
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("parseTimeExpression", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // -----------------------------------------------------------------------
  // EN expressions
  // -----------------------------------------------------------------------
  describe("EN expressions", () => {
    it("parses 'today'", () => {
      const r = parseTimeExpression("today");
      expectRange(r);
      expect(r.from).toEqual(startOfDay(FIXED_NOW));
      expect(r.to).toEqual(endOfDay(FIXED_NOW));
    });

    it("parses 'yesterday'", () => {
      const r = parseTimeExpression("yesterday");
      expectRange(r);
      const yesterday = new Date(FIXED_NOW);
      yesterday.setDate(yesterday.getDate() - 1);
      expect(r.from).toEqual(startOfDay(yesterday));
      expect(r.to).toEqual(endOfDay(yesterday));
    });

    it("parses 'this week'", () => {
      const r = parseTimeExpression("this week");
      expectRange(r);
      // Monday of current week
      expect(r.from!.getDay()).toBe(1); // Monday
      expect(r.to).toEqual(endOfDay(FIXED_NOW));
    });

    it("parses 'last week'", () => {
      const r = parseTimeExpression("last week");
      expectRange(r);
      expect(r.from!.getDay()).toBe(1); // Monday
      // last week ends just before this week starts
      expect(r.to!.getTime()).toBeLessThan(r.from!.getTime() + 7 * 24 * 60 * 60 * 1000);
    });

    it("parses 'this month'", () => {
      const r = parseTimeExpression("this month");
      expectRange(r);
      expect(r.from).toEqual(new Date(2026, 2, 1)); // March 1
      expect(r.to).toEqual(endOfDay(FIXED_NOW));
    });

    it("parses 'last month'", () => {
      const r = parseTimeExpression("last month");
      expectRange(r);
      expect(r.from).toEqual(new Date(2026, 1, 1)); // February 1
      expect(r.to).toEqual(new Date(2026, 2, 0, 23, 59, 59, 999)); // Feb 28
    });

    it("parses 'last 7 days'", () => {
      const r = parseTimeExpression("last 7 days");
      expectRange(r);
      const sevenDaysAgo = new Date(FIXED_NOW);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      expect(r.from).toEqual(startOfDay(sevenDaysAgo));
      expect(r.to).toEqual(endOfDay(FIXED_NOW));
    });

    it("parses 'last 30 days'", () => {
      const r = parseTimeExpression("last 30 days");
      expectRange(r);
      const thirtyDaysAgo = new Date(FIXED_NOW);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      expect(r.from).toEqual(startOfDay(thirtyDaysAgo));
      expect(r.to).toEqual(endOfDay(FIXED_NOW));
    });
  });

  // -----------------------------------------------------------------------
  // JA expressions
  // -----------------------------------------------------------------------
  describe("JA expressions", () => {
    it("parses '今日'", () => {
      const r = parseTimeExpression("今日");
      expectRange(r);
      expect(r.from).toEqual(startOfDay(FIXED_NOW));
      expect(r.to).toEqual(endOfDay(FIXED_NOW));
    });

    it("parses '昨日'", () => {
      const r = parseTimeExpression("昨日");
      expectRange(r);
      const yesterday = new Date(FIXED_NOW);
      yesterday.setDate(yesterday.getDate() - 1);
      expect(r.from).toEqual(startOfDay(yesterday));
    });

    it("parses '今週'", () => {
      const r = parseTimeExpression("今週");
      expectRange(r);
      expect(r.from!.getDay()).toBe(1);
    });

    it("parses '先週'", () => {
      const r = parseTimeExpression("先週");
      expectRange(r);
      expect(r.from!.getDay()).toBe(1);
    });
  });

  // -----------------------------------------------------------------------
  // ES expressions
  // -----------------------------------------------------------------------
  describe("ES expressions", () => {
    it("parses 'hoy'", () => {
      const r = parseTimeExpression("hoy");
      expectRange(r);
      expect(r.from).toEqual(startOfDay(FIXED_NOW));
    });

    it("parses 'ayer'", () => {
      const r = parseTimeExpression("ayer");
      expectRange(r);
      const yesterday = new Date(FIXED_NOW);
      yesterday.setDate(yesterday.getDate() - 1);
      expect(r.from).toEqual(startOfDay(yesterday));
    });

    it("parses 'esta semana'", () => {
      const r = parseTimeExpression("esta semana");
      expectRange(r);
      expect(r.from!.getDay()).toBe(1);
    });
  });

  // -----------------------------------------------------------------------
  // Unknown / fallback
  // -----------------------------------------------------------------------
  describe("unknown expressions", () => {
    it("returns empty object for unrecognized strings", () => {
      const r = parseTimeExpression("some random text");
      expect(r.from).toBeUndefined();
      expect(r.to).toBeUndefined();
    });

    it("returns empty object for empty string", () => {
      const r = parseTimeExpression("");
      expect(r.from).toBeUndefined();
      expect(r.to).toBeUndefined();
    });
  });

  // -----------------------------------------------------------------------
  // Mixed queries (expression embedded in a sentence)
  // -----------------------------------------------------------------------
  describe("mixed queries", () => {
    it("detects 'today' in 'what did I do today'", () => {
      const r = parseTimeExpression("what did I do today");
      expectRange(r);
      expect(r.from).toEqual(startOfDay(FIXED_NOW));
      expect(r.to).toEqual(endOfDay(FIXED_NOW));
    });

    it("detects 'yesterday' in 'show me yesterday's work'", () => {
      const r = parseTimeExpression("show me yesterday's work");
      expectRange(r);
      const yesterday = new Date(FIXED_NOW);
      yesterday.setDate(yesterday.getDate() - 1);
      expect(r.from).toEqual(startOfDay(yesterday));
    });

    it("detects 'this week' in 'summary of this week'", () => {
      const r = parseTimeExpression("summary of this week");
      expectRange(r);
      expect(r.from!.getDay()).toBe(1);
    });

    it("is case-insensitive", () => {
      const r = parseTimeExpression("TODAY");
      expectRange(r);
      expect(r.from).toEqual(startOfDay(FIXED_NOW));
    });
  });
});
