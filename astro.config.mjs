// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Same source of truth as src/config.ts, so canonical URLs and the sitemap
// follow the deployment domain instead of drifting from it.
import siteConfig from './site.config.json' with { type: 'json' };

export default defineConfig({
  site: `https://${siteConfig.labels.site}.${siteConfig.baseDomain}`,
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
