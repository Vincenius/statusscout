import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const contentDir = resolve(root, 'src/content/blog');

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) return {};
  const fm = {};
  match[1].split('\n').forEach(line => {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) return;
    const key = line.slice(0, colonIdx).trim();
    const value = line.slice(colonIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (key) fm[key] = value;
  });
  return fm;
}

function getBlogPosts() {
  if (!fs.existsSync(contentDir)) return [];
  return fs.readdirSync(contentDir)
    .filter(f => f.endsWith('.md'))
    .map(f => ({ slug: f.replace(/\.md$/, ''), ...parseFrontmatter(fs.readFileSync(resolve(contentDir, f), 'utf-8')) }));
}

function getStaticRoutes() {
  const pagesDir = resolve(root, 'src/pages');
  function scan(dir, base = '') {
    const routes = [];
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name.startsWith('_') || e.name.startsWith('.')) continue;
      if (e.isDirectory()) {
        routes.push(...scan(resolve(dir, e.name), base ? `${base}/${e.name}` : e.name));
        continue;
      }
      if (!/\.(jsx|tsx)$/.test(e.name) || e.name.includes('[')) continue;
      const name = e.name.replace(/\.[^/.]+$/, '');
      const route = name === 'index' ? (base ? `/${base}` : '/') : `/${base ? `${base}/` : ''}${name}`;
      routes.push(route);
    }
    return [...new Set(routes)];
  }
  return scan(pagesDir);
}

function buildSitemap(routes, blogPosts, baseUrl) {
  const EXCLUDE = new Set(['/404']);
  const today = new Date().toISOString().slice(0, 10);

  const urls = routes
    .filter(r => !EXCLUDE.has(r))
    .map(r => {
      const slug = r.startsWith('/blog/') ? r.slice(6) : null;
      const post = slug ? blogPosts.find(p => p.slug === slug) : null;
      const lastmod = post?.date || today;
      return `  <url>\n    <loc>${baseUrl}${r}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`;
    });

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}

function injectIntoTemplate(template, appHtml, helmet) {
  let html = template;

  html = html.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);

  if (!helmet) return html;

  const helmetTags = [
    helmet.title?.toString(),
    helmet.meta?.toString(),
    helmet.link?.toString(),
    helmet.script?.toString(),
  ].filter(Boolean).join('\n  ');

  if (!helmetTags) return html;

  // Remove tags that we are replacing (avoids duplicates)
  const REMOVE = [
    /<title>[^<]*<\/title>\s*/g,
    /<meta\s+name="description"[^>]*\/?>\s*/g,
    /<meta\s+property="og:[^"]*"[^>]*\/?>\s*/g,
    /<meta\s+name="twitter:[^"]*"[^>]*\/?>\s*/g,
  ];
  for (const re of REMOVE) html = html.replace(re, '');

  // Insert after <meta charset>
  html = html.replace(
    /(<meta\s+charset="[^"]*"[^>]*>)/,
    `$1\n  ${helmetTags}`
  );

  return html;
}

async function prerender() {
  // Import the server bundle compiled by `vite build --ssr`
  const serverBundle = resolve(root, 'dist-server/entry-server.js');
  if (!fs.existsSync(serverBundle)) {
    throw new Error(`Server bundle not found at ${serverBundle}. Run vite build --ssr first.`);
  }
  const { render } = await import(serverBundle);

  const template = fs.readFileSync(resolve(root, 'dist/index.html'), 'utf-8');
  const blogPosts = getBlogPosts();
  const BASE_URL = process.env.VITE_LANDING_URL || 'https://statusscout.dev';
  const routes = [
    ...getStaticRoutes(),
    ...blogPosts.map(p => `/blog/${p.slug}`),
  ];

  const sitemap = buildSitemap(routes, blogPosts, BASE_URL);
  fs.writeFileSync(resolve(root, 'dist/sitemap.xml'), sitemap);
  console.log('Generated: sitemap.xml');

  for (const route of routes) {
    let appHtml = '';
    let helmet = null;
    try {
      ({ html: appHtml, helmet } = render(route));
    } catch (e) {
      console.warn(`  SSR render failed for ${route}: ${e.message}`);
    }

    const finalHtml = injectIntoTemplate(template, appHtml, helmet);

    const outPath = route === '/'
      ? resolve(root, 'dist/index.html')
      : resolve(root, `dist${route}/index.html`);

    fs.mkdirSync(dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, finalHtml);
    console.log(`Pre-rendered: ${route}`);
  }
}

prerender().catch(err => {
  console.error('Prerender failed:', err);
  process.exit(1);
});
