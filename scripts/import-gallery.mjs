/**
 * Build `content/gallery.json` from the rover demo's published workflow gallery.
 *
 * The output is committed, so a site build never depends on the network:
 *
 *   node scripts/import-gallery.mjs
 *
 * These are the five workflows exported from the machine that drives the
 * PHYSICAL rover, which is a different set from the eleven teaching workflows
 * `import-workflows.mjs` pulls out of the demo's `demo/workflows` folder. They
 * name real hardware — a drill, a load cell, a tool changer, a manipulator —
 * that the simulated rover does not have, and they ship `active: true` from the
 * instance they came off. The demo deliberately never imports them into n8n;
 * neither do we. They are here to be read.
 *
 * --- why this fetches rather than reads the repo -----------------------------
 *
 * The exports in `demo/gallery/*.json` are VERBATIM and unredacted: they carry
 * the production instance fingerprint, credential ids, and the webhook ids that
 * are the only thing standing between a passer-by and a real drill. The demo's
 * `publish.py` is what strips them, and it refuses to write a file if any of it
 * survives.
 *
 * So this takes the artifact that has already been through that check, from the
 * viewer that serves it, rather than re-deriving the redaction here. A second
 * implementation of a security-critical transform in a second language is a
 * second thing to get wrong. The invariant is simply: this site publishes
 * exactly what the demo already publishes, and nothing else.
 *
 * `verify()` below then re-checks that independently, because "I fetched the
 * right URL" is an assumption and the raw exports are a public GitHub file away.
 */
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import siteConfig from '../site.config.json' with { type: 'json' };

const here = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(here, '../content/gallery.json');

/** Follows site.config.json, so the zone lives in exactly one place. */
const GALLERY = `https://${siteConfig.labels.turtle}.${siteConfig.baseDomain}/gallery`;

/** The unredacted originals, used only to prove they did not come through. */
const RAW = 'https://raw.githubusercontent.com/sacovo/n8n-nodes-ros2/main/demo/gallery';

const getJson = async (url) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText} for ${url}`);
  return response.json();
};

/**
 * Every identifier that must NOT appear in what we are about to commit.
 *
 * Read out of the public originals rather than hardcoded, so a workflow added
 * to the gallery later is covered without anyone remembering to update a list.
 * A failure here means the fetched file was not the redacted one.
 */
function secretsOf(original) {
  const found = [];
  if (original.versionId) found.push(original.versionId);
  if (original.meta?.instanceId) found.push(original.meta.instanceId);
  for (const node of original.nodes ?? []) {
    if (node.webhookId) found.push(node.webhookId);
    for (const cred of Object.values(node.credentials ?? {})) {
      if (cred?.id) found.push(cred.id);
    }
  }
  return found;
}

async function verify(slug, publishedText) {
  let original;
  try {
    original = await getJson(`${RAW}/${slug}.json`);
  } catch (error) {
    // Not fatal: the check is a belt on top of publish.py's own braces, and the
    // mirror may lag a gallery that gained a workflow today. Say so loudly
    // rather than reporting a verification that did not happen.
    console.warn(`  ! could not fetch the original for ${slug} (${error.message}) — NOT verified`);
    return 0;
  }

  const leaked = secretsOf(original).filter((secret) => publishedText.includes(secret));
  if (leaked.length) {
    throw new Error(
      `${slug}: ${leaked.length} unredacted identifier(s) survived — refusing to write.\n` +
        `First: ${leaked[0]}\nThe fetched file is not the redacted one.`,
    );
  }
  return secretsOf(original).length;
}

const index = await getJson(`${GALLERY}/index.json`);
console.log(`Fetched ${index.workflows.length} workflows from ${GALLERY}`);

const workflows = [];
for (const entry of index.workflows) {
  const workflow = await getJson(`${GALLERY}/${entry.file}`);
  const text = JSON.stringify(workflow);

  const checked = await verify(entry.slug, text);
  console.log(`  ${entry.slug.padEnd(18)} ${entry.stats.nodes} nodes, ${checked} identifier(s) checked`);

  workflows.push({
    slug: entry.slug,
    title: entry.title,
    subtitle: entry.subtitle ?? '',
    blurb: entry.blurb ?? '',
    highlights: entry.highlights ?? [],
    // Sticky-note headings, which is how these label their own phases.
    phases: entry.phases ?? [],
    // ROS names touched, bucketed into services / topics / actions.
    interfaces: entry.interfaces ?? {},
    nodeCount: entry.stats.nodes,
    rosCount: entry.stats.ros,
    // The canvas renderer takes the whole export as a string prop, same as the
    // eleven demo workflows do.
    workflow: JSON.stringify({ nodes: workflow.nodes, connections: workflow.connections }),
  });
}

writeFileSync(OUT, JSON.stringify({ workflows }, null, 2) + '\n');
const kb = (JSON.stringify(workflows).length / 1024).toFixed(0);
console.log(`\nWrote ${workflows.length} workflows to ${OUT} (${kb} kB)`);
