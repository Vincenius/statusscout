const postModules = import.meta.glob('../content/blog/*.md', { query: '?raw', import: 'default' });

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: content };

  const frontmatter = {};
  match[1].split('\n').forEach(line => {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) return;
    const key = line.slice(0, colonIdx).trim();
    const value = line.slice(colonIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (key) frontmatter[key] = value;
  });

  return { frontmatter, body: match[2] };
}

export async function getAllPosts() {
  const posts = await Promise.all(
    Object.entries(postModules).map(async ([filePath, load]) => {
      const raw = await load();
      const slug = filePath.split('/').pop().replace(/\.md$/, '');
      const { frontmatter, body } = parseFrontmatter(raw);
      return { slug, ...frontmatter, body };
    })
  );
  return posts.sort((a, b) => new Date(b.date) - new Date(a.date));
}

export async function getPost(slug) {
  const entry = Object.entries(postModules).find(([filePath]) =>
    filePath.endsWith(`/${slug}.md`)
  );
  if (!entry) return null;
  const raw = await entry[1]();
  const { frontmatter, body } = parseFrontmatter(raw);
  return { slug, ...frontmatter, body };
}
