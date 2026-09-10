/**
 * The PushT demo's measured numbers, as `/demos/pusht` prints them.
 *
 * `content/pusht-scenarios.json` is generated — run
 * `node scripts/sync-pusht-scenarios.mjs` after the demo re-measures, never
 * edit it. Typing it here means a shape change in that pipeline is a build
 * error on this side rather than a page quietly rendering "undefined".
 *
 * Everything below is `max_reward` = max coverage of the target pose divided
 * by PushT's 0.95 success bar, clipped to 1. It is not a success rate: not
 * even the human demonstrations clear that bar reliably, so a success rate
 * would read as near zero for every policy in the literature.
 */
import raw from '../../content/pusht-scenarios.json';

export interface PairedComparison {
  n: number;
  python_mean: number;
  browser_mean: number;
  mean_difference: number;
  sem_difference: number;
  z: number;
}

export interface RunSummary {
  file: string;
  n: number;
  avg_max_reward: number;
  sem: number;
  execution_provider?: string;
}

export interface ScenarioMeta {
  generated: string;
  paired: PairedComparison;
  policy: string;
  cfg_weight: number;
  n_action_steps: number;
  python_run: RunSummary;
  browser_run: RunSummary;
  /** Share of starting states the policy makes no progress from at all. */
  zero_fraction: number;
  note: string;
}

/** One curated starting state, with the reward each runtime actually got. */
export interface Scenario {
  id: string;
  label: string;
  note: string;
  seed: number;
  state: number[];
  python: number;
  browser: number;
  python_final: number;
  browser_final: number;
  angle: number;
}

/** One guidance weight, and how it compares to the one the demo ships. */
export interface GuidanceRow {
  w: number;
  n: number;
  file: string;
  peak: number;
  peakSem: number;
  /** Episodes that cleared PushT's 0.95 bar outright. */
  cleared: number;
  shipped: boolean;
  paired?: { n: number; mean: number; sem: number; z: number };
}

export interface Guidance {
  shippedW: number;
  rows: GuidanceRow[];
}

/**
 * The small state-only policy this one is measured against.
 *
 * It is on the page because leaving it off would make the demo read as a
 * result. It is not one: a 0.57 M-parameter MLP with privileged state beats
 * the VLA here, and the interesting part of the demo is what the policy family
 * does, not where it lands on this task.
 */
export interface Baseline {
  label: string;
  file: string;
  n: number;
  peak: number;
  peakSem: number;
  cleared: number;
  paired?: { n: number; mean: number; sem: number; z: number };
}

/** What a visitor downloads to run the real policy, weighed on the export. */
export interface ModelSize {
  bytes: number;
  graphs: number;
}

export interface PushtData {
  generated: string;
  /** Short name of the checkpoint every number here was measured on. */
  checkpoint: string;
  /** Null when the sync ran without the export symlink resolving. */
  model: ModelSize | null;
  /** Where the deployed demo fetches its weights, pinned to a commit. */
  weightsUrl: string | null;
  meta: ScenarioMeta;
  scenarios: Scenario[];
  guidance: Guidance | null;
  baseline: Baseline | null;
}

export const pusht = raw as unknown as PushtData;

export const { meta, scenarios, guidance, checkpoint, model, weightsUrl, baseline } = pusht;

/**
 * Whether the guidance sweep separates any weight from the shipped one.
 *
 * The page says "flat within noise" or does not, decided by the numbers rather
 * than by whoever last edited the sentence. Two standard errors is the same
 * bar the demo's own results line uses.
 */
export const guidanceIsFlat = (g: Guidance | null): boolean =>
  g === null || g.rows.every((r) => !r.paired || Math.abs(r.paired.z) < 2);

/**
 * `0.5977` → `0.598`. Three places is what the underlying sems justify.
 *
 * Negatives come back with a real minus sign, not a hyphen: these sit inline in
 * running prose at body size, where U+002D is short enough to read as a dash
 * between two numbers rather than as the sign of one.
 */
export const fmt = (x: number, places = 3): string =>
  x.toFixed(places).replace(/^-/, '\u2212');

/** `1` → `1`, `1.5` → `1.5`. Guidance weights are not currency. */
export const fmtW = (w: number): string => String(w);

/** `1575081595` → `1.58 GB`, the same figure the demo's own button prints. */
export const fmtBytes = (bytes: number): string => `${(bytes / 1e9).toFixed(2)} GB`;
