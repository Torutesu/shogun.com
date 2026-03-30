import { Hono } from "hono";

// ---------------------------------------------------------------------------
// In-memory Prometheus metrics store
// ---------------------------------------------------------------------------

/** Counter: simple monotonically-increasing value keyed by labels. */
const counters = new Map<string, number>();

/** Histogram buckets (seconds) for request duration. */
const DURATION_BUCKETS = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];

/** Histogram observations: key → { buckets, sum, count }. */
interface HistogramData {
  buckets: number[];
  sum: number;
  count: number;
}
const histograms = new Map<string, HistogramData>();

/** Gauge: arbitrary numeric value. */
const gauges = new Map<string, number>();

// ---------------------------------------------------------------------------
// Public helpers (used by metrics middleware & other modules)
// ---------------------------------------------------------------------------

export function incrementCounter(name: string, labels: Record<string, string>, amount = 1): void {
  const key = formatKey(name, labels);
  counters.set(key, (counters.get(key) ?? 0) + amount);
}

export function observeHistogram(name: string, labels: Record<string, string>, value: number): void {
  const key = formatKey(name, labels);
  let data = histograms.get(key);
  if (!data) {
    data = { buckets: new Array(DURATION_BUCKETS.length).fill(0) as number[], sum: 0, count: 0 };
    histograms.set(key, data);
  }
  for (let i = 0; i < DURATION_BUCKETS.length; i++) {
    if (value <= DURATION_BUCKETS[i]) {
      data.buckets[i]++;
    }
  }
  data.sum += value;
  data.count++;
}

export function setGauge(name: string, labels: Record<string, string>, value: number): void {
  const key = formatKey(name, labels);
  gauges.set(key, value);
}

export function incrementGauge(name: string, labels: Record<string, string>, amount = 1): void {
  const key = formatKey(name, labels);
  gauges.set(key, (gauges.get(key) ?? 0) + amount);
}

export function decrementGauge(name: string, labels: Record<string, string>, amount = 1): void {
  const key = formatKey(name, labels);
  gauges.set(key, (gauges.get(key) ?? 0) - amount);
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function formatKey(name: string, labels: Record<string, string>): string {
  const parts = Object.entries(labels)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}="${v}"`)
    .join(",");
  return parts ? `${name}{${parts}}` : name;
}

function serializeCounters(): string {
  const lines: string[] = [];
  const seen = new Set<string>();
  for (const [key, value] of counters) {
    const name = key.split("{")[0];
    if (!seen.has(name)) {
      lines.push(`# HELP ${name} Counter`);
      lines.push(`# TYPE ${name} counter`);
      seen.add(name);
    }
    lines.push(`${key} ${value}`);
  }
  return lines.join("\n");
}

function serializeGauges(): string {
  const lines: string[] = [];
  const seen = new Set<string>();
  for (const [key, value] of gauges) {
    const name = key.split("{")[0];
    if (!seen.has(name)) {
      lines.push(`# HELP ${name} Gauge`);
      lines.push(`# TYPE ${name} gauge`);
      seen.add(name);
    }
    lines.push(`${key} ${value}`);
  }
  return lines.join("\n");
}

function serializeHistograms(): string {
  const lines: string[] = [];
  const seen = new Set<string>();
  for (const [key, data] of histograms) {
    const name = key.split("{")[0];
    // Extract labels portion (between { and })
    const labelsMatch = key.match(/\{(.+)\}/);
    const labelsStr = labelsMatch ? labelsMatch[1] : "";
    const labelPrefix = labelsStr ? `${labelsStr},` : "";

    if (!seen.has(name)) {
      lines.push(`# HELP ${name} Histogram`);
      lines.push(`# TYPE ${name} histogram`);
      seen.add(name);
    }

    let cumulative = 0;
    for (let i = 0; i < DURATION_BUCKETS.length; i++) {
      cumulative += data.buckets[i];
      lines.push(`${name}_bucket{${labelPrefix}le="${DURATION_BUCKETS[i]}"} ${cumulative}`);
    }
    lines.push(`${name}_bucket{${labelPrefix}le="+Inf"} ${data.count}`);
    lines.push(`${name}_sum{${labelsStr}} ${data.sum}`);
    lines.push(`${name}_count{${labelsStr}} ${data.count}`);
  }
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

const metricsRoutes = new Hono();

metricsRoutes.get("/", (c) => {
  const sections = [
    serializeCounters(),
    serializeGauges(),
    serializeHistograms(),
  ].filter(Boolean);

  c.header("Content-Type", "text/plain; version=0.0.4; charset=utf-8");
  return c.body(sections.join("\n\n") + "\n");
});

export default metricsRoutes;
