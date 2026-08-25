/**
 * Build `content/workflows.json` from the demo's workflow exports.
 *
 * The output is committed, so a site build never depends on the network or on
 * a sibling checkout being present. Re-run this when the demo workflows change:
 *
 *   node scripts/import-workflows.mjs
 *
 * It prefers a local checkout next to this repo and falls back to the public
 * GitHub mirror, so it works whether or not you have the demo cloned.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const LOCAL = resolve(here, '../../n8n-nodes-ros2/demo/workflows');
const RAW = 'https://raw.githubusercontent.com/sacovo/n8n-nodes-ros2/main/demo/workflows';
const API = 'https://api.github.com/repos/sacovo/n8n-nodes-ros2/contents/demo/workflows';
const OUT = resolve(here, '../content/workflows.json');

/**
 * What each workflow is for, in one line. Taken from the demo README's own
 * table rather than invented here, so the two cannot drift into disagreeing
 * about what a workflow demonstrates.
 */
const SHOWS = {
  'demo-01-patrol': 'Schedule → Service Call → Action, sending a goal and waiting on its feedback.',
  'demo-02-battery':
    'Topic Trigger with a conditions filter, so the workflow only wakes for messages that matter.',
  'demo-03-drive': 'An n8n Form with a dropdown of places, driving an Action with live feedback.',
  'demo-04-service-trigger': 'Service Trigger — n8n advertises a ROS service that ROS can call.',
  'demo-05-action-trigger':
    'Action Trigger and Respond — n8n advertises an action server, sends feedback, then succeeds.',
  'demo-06-snapshot': 'Webhook → Capture Image, returning a JPEG from a camera topic.',
  'demo-07-agent':
    'An AI agent with vision: it discovers the graph, drives the rover, and looks through its camera.',
  'demo-08-reset': 'Housekeeping — calls /rover/reset_demo every hour so the demo stays clean.',
  'demo-09-planner':
    'The model plans, n8n executes: plain language in, a JSON plan out, executed step by step.',
  'demo-10-manual':
    'Runtime discovery turned into an operator manual, written from the live ROS graph.',
  'demo-11-responder':
    'The same trigger as 02, but an agent decides whether to dock, finish, or e-stop.',
};

/** Workflows that ship inactive, and why. Stated rather than left puzzling. */
const INACTIVE = {
  'demo-11-responder':
    'Ships inactive on purpose: it listens to the same battery_low event as workflow 02, so running both means two things racing to command the rover. Turn 02 off before turning this on — the pair is meant to be shown as a before/after, fixed logic against a reasoned decision.',
};

const isRos = (type) => type.startsWith('@fhnw-rover/n8n-nodes-ros2.');
const shortType = (type) => type.split('.').pop();

async function load() {
  if (existsSync(LOCAL)) {
    const files = readdirSync(LOCAL).filter((f) => f.endsWith('.json')).sort();
    console.log(`Reading ${files.length} workflows from ${LOCAL}`);
    return files.map((f) => JSON.parse(readFileSync(join(LOCAL, f), 'utf8')));
  }

  console.log(`No local checkout at ${LOCAL}; fetching from GitHub`);
  const listing = await fetch(API).then((r) => r.json());
  if (!Array.isArray(listing)) throw new Error(`GitHub listing failed: ${JSON.stringify(listing)}`);
  const names = listing.map((e) => e.name).filter((n) => n.endsWith('.json')).sort();
  return Promise.all(names.map((n) => fetch(`${RAW}/${n}`).then((r) => r.json())));
}

const workflows = (await load()).map((w) => {
  const nodes = w.nodes ?? [];
  const rosNodes = [...new Set(nodes.filter((n) => isRos(n.type)).map((n) => shortType(n.type)))];

  return {
    id: w.id,
    // "01 - Landmark Tour (Schedule -> Action)" → number and title, so the
    // page can set them typographically instead of printing the raw export.
    number: (w.name.match(/^(\d+)/) ?? [, '??'])[1],
    title: w.name.replace(/^\d+\s*-\s*/, '').replace(/\s*\([^)]*\)\s*$/, ''),
    shows: SHOWS[w.id] ?? '',
    inactive: INACTIVE[w.id] ?? null,
    nodeCount: nodes.length,
    rosNodes,
    // The canvas renderer takes the whole export as a string prop.
    workflow: JSON.stringify({ nodes: w.nodes, connections: w.connections }),
  };
});

workflows.sort((a, b) => a.number.localeCompare(b.number));

const missing = workflows.filter((w) => !w.shows).map((w) => w.id);
if (missing.length) console.warn(`No description for: ${missing.join(', ')}`);

writeFileSync(OUT, JSON.stringify({ workflows }, null, 2) + '\n');
const kb = (JSON.stringify(workflows).length / 1024).toFixed(0);
console.log(`Wrote ${workflows.length} workflows to ${OUT} (${kb} kB)`);
