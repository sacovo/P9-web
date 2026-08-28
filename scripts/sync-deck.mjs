/**
 * Build a Slidev deck and copy it into public/<its url path>/.
 *
 * Two decks live in this repo, each an npm workspace of it, so one `npm ci`
 * installs Astro and both decks and `npm run build` produces the site with
 * both already inside it:
 *
 *   presentation/  → /smolvla-presentation/   the SmolVLA Fachvortrag
 *   defense/       → /defense/                the thesis defence
 *
 * This has to run BEFORE `astro build`, because Astro copies public/ wholesale
 * into dist/ and will not see a deck that does not exist yet.
 *
 * `--base` has to match the path it is served from, or every asset in the
 * deck 404s. Client-side routes under that prefix are handled by the SPA
 * fallbacks in vercel.json, public/_redirects and deploy/Caddyfile — adding a
 * deck here means adding it there too.
 *
 *   node scripts/sync-deck.mjs <deck>          # a key of DECKS below
 *   node scripts/sync-deck.mjs path/to/deck    # any directory holding slides.md
 */
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

/** Directory → URL path. The URL path is also the `--base`, so the two cannot drift. */
const DECKS = {
  presentation: '/smolvla-presentation/',
  defense: '/defense/',
};

const arg = process.argv[2] ?? 'presentation';

const known = Object.keys(DECKS).find((d) => d === arg);
const source = known ? resolve(here, '..', known) : resolve(arg);
const base = known ? DECKS[known] : DECKS[arg.replace(/\/+$/, '').split('/').pop()];

if (!base) {
  console.error(
    `Unknown deck ${arg}. Give one of ${Object.keys(DECKS).join(', ')}, or a path whose ` +
      `directory name is one of them.`,
  );
  process.exit(1);
}

if (!existsSync(resolve(source, 'slides.md'))) {
  console.error(`No Slidev deck at ${source}`);
  process.exit(1);
}

const target = resolve(here, `../public${base}`);
const out = resolve(source, 'dist/web');

console.log(`Building ${source} → ${base}`);
execFileSync('npx', ['slidev', 'build', '--base', base, '--out', out], {
  cwd: source,
  stdio: 'inherit',
});

// Stale slides survive a rebuild otherwise: the file names are content-hashed.
rmSync(target, { recursive: true, force: true });
cpSync(out, target, {
  recursive: true,
  // Slidev emits its own Netlify-style _redirects, which only has an effect at
  // the site root. Ours lives in public/_redirects and says the same thing.
  filter: (src) => !src.endsWith('/_redirects'),
});

console.log(`\nCopied ${out}\n     → ${target}`);
