import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pagesDir = path.join(__dirname, '../src/pages');
const nginxConfPath = path.join(__dirname, '../nginx.conf');

function getRoutes(dir, base = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let routes = [];

  for (const e of entries) {
    if (e.name.startsWith('_') || e.name.startsWith('.')) continue;

    const fullPath = path.join(dir, e.name);

    if (e.isDirectory()) {
      const newBase = base ? `${base}/${e.name}` : e.name;
      routes = routes.concat(getRoutes(fullPath, newBase));
      continue;
    }

    if (!/\.(jsx|tsx)$/.test(e.name)) continue;

    const name = e.name.replace(/\.[^/.]+$/, '');
    let route;

    if (name === 'index') {
      route = base ? `/${base}` : '/';
    } else {
      route = `/${base ? `${base}/` : ''}${name}`;
    }

    route = route.replace(/\\+/g, '/');
    routes.push(route);
  }

  return [...new Set(routes)];
}

function generateLocationBlocks(routes) {
  // Static routes: serve the pre-rendered index.html for that route, fall back to root
  const staticBlocks = routes
    .filter(r => r !== '/404' && r !== '/' && !r.includes('['))
    .map(route => {
      const file = `${route.slice(1)}/index.html`;
      return `  location = ${route} {\n    try_files /${file} /index.html;\n  }`;
    });

  // Dynamic routes like /blog/[slug]: serve the pre-rendered slug file, fall back to root
  const dynamicDirs = [...new Set(
    routes
      .filter(r => r.includes('['))
      .map(r => r.substring(0, r.lastIndexOf('/')))
      .filter(Boolean)
  )];

  const dynamicBlocks = dynamicDirs.map(dir =>
    `  location ~ ^${dir}/([^/]+)$ {\n    try_files ${dir}/$1/index.html /index.html;\n  }`
  );

  return [...staticBlocks, ...dynamicBlocks].join('\n');
}

const routes = getRoutes(pagesDir);
console.log('Generate routes:', routes);
const locationBlocks = generateLocationBlocks(routes);

let conf = fs.readFileSync(nginxConfPath, 'utf8');
// Use function replacement to prevent $ in locationBlocks (e.g. $1) being
// interpreted as a back-reference by String.replace().
conf = conf.replace(
  /(# routes:start\n)[\s\S]*?(# routes:end)/,
  (_, start, end) => `${start}${locationBlocks}\n  ${end}`
);

fs.writeFileSync(nginxConfPath, conf);
console.log('nginx.conf updated with frontend routes.');
