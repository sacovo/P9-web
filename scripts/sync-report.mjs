/**
 * Copy the compiled thesis into public/ and switch the download links on.
 *
 * Deliberately a manual step rather than a build-time one: the working PDF
 * carries todonotes and a "List of Tasks and Topics to Cover" page, and that
 * must not reach the public site by accident. Run this once the report is
 * frozen, then set `report.pdf` in src/config.ts to the emitted path.
 *
 *   node scripts/sync-report.mjs [path/to/main.pdf]
 */
import { copyFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const DEFAULT_SOURCE = resolve(here, '../../../P9-Mars-Rover-Autonomy/build/main.pdf');
const TARGET = resolve(here, '../public/p9-mars-rover-autonomy.pdf');

const source = process.argv[2] ? resolve(process.argv[2]) : DEFAULT_SOURCE;

if (!existsSync(source)) {
  console.error(`No PDF at ${source}\nBuild it first (\`make\` in the thesis repo), or pass a path.`);
  process.exit(1);
}

mkdirSync(dirname(TARGET), { recursive: true });
copyFileSync(source, TARGET);

const mb = (statSync(TARGET).size / 1024 / 1024).toFixed(1);
console.log(`Copied ${source}\n     → ${TARGET} (${mb} MB)`);
console.log('\nNow set `report.pdf` in src/config.ts to "/p9-mars-rover-autonomy.pdf".');
console.log('Check first that the PDF was built without todonotes.');
