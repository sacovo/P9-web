/**
 * Build the Slidev talk deck and copy it into public/smolvla-presentation/.
 *
 * The deck source lives in `presentation/`, an npm workspace of this repo, so
 * one `npm ci` installs Astro and Slidev together and `npm run build` produces
 * the site and the deck in one step. The build output is generated, not
 * committed — see .gitignore.
 *
 * This has to run BEFORE `astro build`, because Astro copies public/ wholesale
 * into dist/ and will not see a deck that does not exist yet.
 *
 * `--base` has to match the path it is served from, or every asset in the
 * deck 404s. Client-side routes under that prefix are handled by the SPA
 * fallbacks in vercel.json, public/_redirects and deploy/Caddyfile.
 *
 *   node scripts/sync-deck.mjs [path/to/deck]
 */
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

/** Also the URL path, so the two cannot drift. */
const BASE = '/smolvla-presentation/';

const DEFAULT_SOURCE = resolve(here, '../presentation');
const TARGET = resolve(here, `../public${BASE}`);

const source = process.argv[2] ? resolve(process.argv[2]) : DEFAULT_SOURCE;

if (!existsSync(resolve(source, 'slides.md'))) {
  console.error(`No Slidev deck at ${source}`);
  process.exit(1);
}

const out = resolve(source, 'dist/web');

console.log(`Building ${source} …`);
execFileSync('npx', ['slidev', 'build', '--base', BASE, '--out', out], {
  cwd: source,
  stdio: 'inherit',
});

// Stale slides survive a rebuild otherwise: the file names are content-hashed.
rmSync(TARGET, { recursive: true, force: true });
cpSync(out, TARGET, {
  recursive: true,
  // Slidev emits its own Netlify-style _redirects, which only has an effect at
  // the site root. Ours lives in public/_redirects and says the same thing.
  filter: (src) => !src.endsWith('/_redirects'),
});

console.log(`\nCopied ${out}\n     → ${TARGET}`);
