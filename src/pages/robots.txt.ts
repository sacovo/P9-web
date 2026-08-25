import type { APIRoute } from 'astro';

/**
 * Generated rather than a static file in public/, so the sitemap URL follows
 * `site.config.json` instead of quietly pointing at a domain we have moved off.
 */
export const GET: APIRoute = ({ site }) =>
  new Response(
    `User-agent: *
Allow: /

Sitemap: ${new URL('sitemap-index.xml', site)}
`,
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
