/**
 * Pull the PushT demo's measured numbers into `content/pusht-scenarios.json`.
 *
 *   node scripts/sync-pusht-scenarios.mjs [path/to/pusht-web-demo]
 *
 * `/demos/pusht` frames a demo that lives in another repository, and PLAN.md §9
 * says the figures printed around that frame are read from the file the
 * measurement pipeline writes rather than typed in by hand — a hand-copied
 * figure is a figure that drifts, and this page and that demo would drift
 * apart first.
 *
 * Two sources, because the demo keeps them in two places:
 *
 *  - `web/src/ui/scenarios.json`, written by `training/pusht/make_scenarios.py`:
 *    the curated starting states and the browser-vs-Python paired comparison.
 *  - `training/outputs/parity_eval/python_*_n100.json`, written by
 *    `parity_eval.py`: one file per guidance weight. The sweep is not in
 *    scenarios.json, and the demo's own explainer prose is the only other place
 *    it appears — which is exactly how it went stale once already, still
 *    quoting round 4 while the page served round 6.
 *
 * Only sweep files whose `meta.policy_path` is the checkpoint scenarios.json
 * was measured on are read, so a stale run from an earlier round cannot be
 * averaged into the table. The paired differences are computed here, per
 * episode seed, against the weight the demo actually ships.
 *
 * The output is committed. This is a manual step, like scripts/sync-report.mjs:
 * the sibling checkout and its 100-episode evaluation outputs are not something
 * a build should depend on.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, realpathSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const DEMO = resolve(here, process.argv[2] ?? '../../pusht-web-demo');
const TARGET = resolve(here, '../content/pusht-scenarios.json');

const SCENARIOS = join(DEMO, 'web/src/ui/scenarios.json');
const SWEEP_DIR = join(DEMO, 'training/outputs/parity_eval');
const EXPORT_LINK = join(DEMO, 'web/public/model');
const ENV_PRODUCTION = join(DEMO, 'web/.env.production');

if (!existsSync(SCENARIOS)) {
  console.error(`No scenarios.json at ${SCENARIOS}`);
  console.error('Pass the path to the pusht-web-demo checkout as the first argument.');
  process.exit(1);
}

const read = (p) => JSON.parse(readFileSync(p, 'utf8'));
const scenarios = read(SCENARIOS);
const policy = scenarios.meta.policy;

/** `.../outputs/pusht_recap6/recap_model/migrated` → `pusht_recap6`. */
const shortCheckpoint = (path) => {
  const parts = String(path).split('/').filter(Boolean);
  const i = parts.lastIndexOf('outputs');
  return parts[i + 1] ?? parts.at(-1) ?? path;
};

const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const sem = (xs) => {
  const m = mean(xs);
  // Population sd over n, matching parity_eval.py's own summary — quoting a
  // different convention than the file this is checked against would make the
  // two disagree in the last digit for no reason.
  const sd = Math.sqrt(mean(xs.map((x) => (x - m) ** 2)));
  return sd / Math.sqrt(xs.length);
};

// --- the guidance sweep, only for the checkpoint being served ---------------
const runs = [];
for (const name of existsSync(SWEEP_DIR) ? readdirSync(SWEEP_DIR).sort() : []) {
  if (!name.startsWith('python_') || !name.endsWith('.json')) continue;
  let run;
  try {
    run = read(join(SWEEP_DIR, name));
  } catch {
    continue; // not an eval file; the directory also holds ad-hoc reports
  }
  const m = run.meta;
  if (!m || m.policy_path !== policy) continue;
  if (m.n_action_steps !== scenarios.meta.n_action_steps) continue;
  if (!Array.isArray(run.episodes) || run.episodes.length === 0) continue;
  runs.push({ file: name, w: m.cfg_weight, episodes: run.episodes });
}

if (runs.length === 0) {
  console.warn(`No sweep runs found for ${shortCheckpoint(policy)} in ${SWEEP_DIR}.`);
  console.warn('The guidance table will be omitted and the page will not print one.');
}

const shippedW = scenarios.meta.cfg_weight;
const shipped = runs.find((r) => r.w === shippedW);

const rows = runs
  .map((r) => {
    const peak = r.episodes.map((e) => e.max_reward);
    const row = {
      w: r.w,
      n: r.episodes.length,
      file: r.file,
      peak: mean(peak),
      peakSem: sem(peak),
      // PushT's own 0.95 coverage bar. Not a success rate anyone should read as
      // one — the human demonstrations do not clear it either — but it is the
      // literature's threshold and the count is honest.
      cleared: r.episodes.filter((e) => e.max_reward >= 1).length,
      shipped: r.w === shippedW,
    };
    // Paired against the shipped weight on the episodes both runs actually ran.
    // Unpaired sems would be ~40 % wider here and would hide that the curve is
    // flat, which is the finding.
    if (shipped && r !== shipped) {
      const bySeed = new Map(shipped.episodes.map((e) => [e.seed, e.max_reward]));
      const diffs = r.episodes
        .filter((e) => bySeed.has(e.seed))
        .map((e) => e.max_reward - bySeed.get(e.seed));
      if (diffs.length > 1) {
        row.paired = { n: diffs.length, mean: mean(diffs), sem: sem(diffs) };
        row.paired.z = row.paired.mean / row.paired.sem;
      }
    }
    return row;
  })
  .sort((a, b) => a.w - b.w);

// --- the baseline the demo has to be read against --------------------------
// A 0.57 M-parameter MLP on the same 206 demonstrations and the same 18-dim
// state still beats this policy, and docs/HANDOFF.md opens with that rather
// than burying it. The page says so too, so the *file* is named here — a
// choice, and the only hand-made one in this script — while every number in it
// is read, including the paired difference against the policy being shipped.
const BASELINE_FILE = 'python_mlp_flow_n100.json';
const BASELINE_LABEL = 'MLP + flow matching, state only (0.57 M parameters)';

let baseline = null;
const baselinePath = join(SWEEP_DIR, BASELINE_FILE);
if (existsSync(baselinePath)) {
  const run = read(baselinePath);
  const peak = run.episodes.map((e) => e.max_reward);
  baseline = {
    label: BASELINE_LABEL,
    file: BASELINE_FILE,
    n: run.episodes.length,
    peak: mean(peak),
    peakSem: sem(peak),
    cleared: run.episodes.filter((e) => e.max_reward >= 1).length,
  };
  if (shipped) {
    const bySeed = new Map(shipped.episodes.map((e) => [e.seed, e.max_reward]));
    const diffs = run.episodes
      .filter((e) => bySeed.has(e.seed))
      .map((e) => e.max_reward - bySeed.get(e.seed));
    if (diffs.length > 1) {
      baseline.paired = { n: diffs.length, mean: mean(diffs), sem: sem(diffs) };
      baseline.paired.z = baseline.paired.mean / baseline.paired.sem;
    }
  }
} else {
  console.warn(`No baseline run at ${baselinePath}; the page will omit the comparison.`);
}

// --- what a visitor downloads, weighed rather than remembered --------------
// The precheck banner tells people the size before they commit to it, and a
// size that is out of date is worse than none: it is the one number on the
// page a visitor checks against their own progress bar.
let model = null;
if (existsSync(EXPORT_LINK)) {
  const dir = realpathSync(EXPORT_LINK);
  const artifacts = readdirSync(dir).filter((f) => f.endsWith('.onnx') || f.endsWith('.onnx.data'));
  if (artifacts.length > 0) {
    model = {
      bytes: artifacts.reduce((sum, f) => sum + statSync(join(dir, f)).size, 0),
      // Two graphs, each with its weights beside it. The split is why the demo
      // can show a prefix phase and a denoise phase separately.
      graphs: artifacts.filter((f) => f.endsWith('.onnx')).length,
    };
  }
}

// Where the deployed build fetches those weights from. Pinned to a commit in
// the demo repo on purpose, so this is the identity of the exact weights, not
// a moving "latest".
let weightsUrl = null;
if (existsSync(ENV_PRODUCTION)) {
  const line = readFileSync(ENV_PRODUCTION, 'utf8').match(/^VITE_MODEL_BASE=(.+)$/m);
  if (line) weightsUrl = line[1].trim();
}

/**
 * The scenario notes are written by a Python script into a JSON string, so they
 * arrive with ASCII `--` where the rest of this site sets an em dash, and with
 * straight quotes. Normalising here rather than in the template keeps it one
 * pass over generated text instead of a rule every consumer has to remember.
 */
const typographic = (text) =>
  String(text)
    .replace(/\s--\s/g, '\u2009\u2014\u2009')
    .replace(/(\d)\s*-\s*(\d)/g, '$1\u2013$2');

const prettyScenarios = scenarios.scenarios.map((s) => ({
  ...s,
  label: typographic(s.label),
  note: typographic(s.note),
}));

const out = {
  $comment:
    'Generated by scripts/sync-pusht-scenarios.mjs from the pusht-web-demo checkout. Do not edit by hand — regenerate it.',
  generated: new Date().toISOString(),
  checkpoint: shortCheckpoint(policy),
  model,
  weightsUrl,
  meta: scenarios.meta,
  scenarios: prettyScenarios,
  guidance: rows.length ? { shippedW, rows } : null,
  baseline,
};

writeFileSync(TARGET, `${JSON.stringify(out, null, 2)}\n`);

console.log(`Read  ${SCENARIOS}`);
console.log(`      ${runs.length} sweep run(s) for ${out.checkpoint}`);
console.log(
  `      model ${model ? `${(model.bytes / 1e9).toFixed(2)} GB over ${model.graphs} graphs` : 'not measured (public/model does not resolve)'}`,
);
console.log(`      weights ${weightsUrl ?? 'same-origin /model/ (VITE_MODEL_BASE unset)'}`);
console.log(
  `      baseline ${baseline ? `${baseline.peak.toFixed(4)} \u00b1 ${baseline.peakSem.toFixed(4)}, ${baseline.cleared}/${baseline.n} cleared` : 'missing'}`,
);
console.log(`Wrote ${TARGET}`);
for (const r of rows) {
  const paired = r.paired
    ? `${r.paired.mean >= 0 ? '+' : ''}${r.paired.mean.toFixed(4)} ± ${r.paired.sem.toFixed(4)} (${r.paired.z.toFixed(2)} sem)`
    : 'shipped';
  console.log(
    `  w=${String(r.w).padEnd(4)} peak ${r.peak.toFixed(4)} ± ${r.peakSem.toFixed(4)}  ` +
      `${String(r.cleared).padStart(3)}/${r.n} cleared  paired ${paired}`,
  );
}
