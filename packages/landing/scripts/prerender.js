import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const contentDir = resolve(root, 'src/content/blog');
const BASE_URL = process.env.VITE_LANDING_URL || 'https://statusscout.dev';

// Meta for static pages — must stay in sync with the Layout props in each page component
const STATIC_META = {
  '/': {
    title: 'StatusScout - Security and uptime monitoring for developers',
    description: 'StatusScout monitors uptime, SSL certificates, security headers, DNS records, and exposed files. Get alerted the moment something goes wrong. Self-hosted, open source.',
    ogImage: '/og.png',
  },
  '/vibe-code': {
    title: 'Finds the security holes AIs leave behind | StatusScout',
    description: 'AI-built apps ship with more vulnerabilities than hand-written ones. StatusScout finds exposed secrets, missing security headers, and open API docs, then generates a fix prompt for each issue.',
    ogImage: '/og-ai.png',
  },
  '/blog': {
    title: 'Blog | StatusScout',
    description: 'Thoughts on website monitoring, web security, and building StatusScout in public.',
    ogImage: '/og.png',
  },
};

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

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildMetaTags({ title, description, ogImage, ogUrl }) {
  const abs = img => img?.startsWith('http') ? img : `${BASE_URL}${img}`;
  const tags = [];
  if (title) {
    tags.push(`<title>${escapeHtml(title)}</title>`);
    tags.push(`<meta property="og:title" content="${escapeHtml(title)}" />`);
    tags.push(`<meta name="twitter:title" content="${escapeHtml(title)}" />`);
  }
  if (description) {
    tags.push(`<meta name="description" content="${escapeHtml(description)}" />`);
    tags.push(`<meta property="og:description" content="${escapeHtml(description)}" />`);
    tags.push(`<meta name="twitter:description" content="${escapeHtml(description)}" />`);
  }
  if (ogImage) {
    tags.push(`<meta property="og:image" content="${abs(ogImage)}" />`);
    tags.push(`<meta name="twitter:image" content="${abs(ogImage)}" />`);
  }
  if (ogUrl) {
    tags.push(`<meta property="og:url" content="${escapeHtml(ogUrl)}" />`);
  }
  return tags;
}

function injectIntoTemplate(template, appHtml, metaTags) {
  let html = template;

  html = html.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);

  if (!metaTags?.length) return html;

  // Remove tags that we are replacing (avoids duplicates)
  const REMOVE = [
    /<title>[^<]*<\/title>\s*/g,
    /<meta\s+name="description"[^>]*\/?>\s*/g,
    /<meta\s+property="og:title"[^>]*\/?>\s*/g,
    /<meta\s+property="og:description"[^>]*\/?>\s*/g,
    /<meta\s+property="og:image"[^>]*\/?>\s*/g,
    /<meta\s+property="og:url"[^>]*\/?>\s*/g,
    /<meta\s+name="twitter:title"[^>]*\/?>\s*/g,
    /<meta\s+name="twitter:description"[^>]*\/?>\s*/g,
    /<meta\s+name="twitter:image"[^>]*\/?>\s*/g,
  ];
  for (const re of REMOVE) html = html.replace(re, '');

  // Insert after <meta charset>
  html = html.replace(
    /(<meta\s+charset="[^"]*"[^>]*>)/,
    `$1\n  ${metaTags.join('\n  ')}`
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
  const routes = [
    ...getStaticRoutes(),
    ...blogPosts.map(p => `/blog/${p.slug}`),
  ];

  for (const route of routes) {
    let appHtml = '';
    try {
      ({ html: appHtml } = render(route));
    } catch (e) {
      console.warn(`  SSR render failed for ${route}: ${e.message}`);
    }

    let meta = STATIC_META[route];
    if (!meta) {
      const slug = route.replace('/blog/', '');
      const post = blogPosts.find(p => p.slug === slug);
      if (post) {
        meta = {
          title: `${post.title} | StatusScout`,
          description: post.description,
          ogImage: post.ogImage || post.image,
        };
      }
    }

    const metaTags = meta ? buildMetaTags({ ...meta, ogUrl: `${BASE_URL}${route}` }) : null;
    const finalHtml = injectIntoTemplate(template, appHtml, metaTags);

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
