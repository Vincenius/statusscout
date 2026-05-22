import fs from 'fs'
import path from 'path'
import pLimit from 'p-limit';
import { createCheckResult } from '../db.js'

function get404Probability(html) {
  if (!html || !html.trim()) return 1;

  const text = html.toLowerCase();

  let score = 0;

  const signals = ["404", "not found", "page not found", "error", "oops", "we can't find", "can't be found", "doesn't exist"];
  for (const s of signals) {
    if (text.includes(s)) score += 0.3;
  }

  const title = text.match(/<title[^>]*>(.*?)<\/title>/);
  if (title && title[1].includes("404")) score += 0.5;

  return Math.min(1, score);
}

// Detects catch-all / SPA fallback: response is identical or nearly identical to the homepage
function isFallbackPage(text, homepageText) {
  if (!text || !homepageText) return false;
  const t = text.trim();
  const h = homepageText.trim();
  if (t === h) return true;
  // Within 2% length and first 500 chars identical → same template rendered
  const ratio = t.length / h.length;
  return ratio > 0.98 && ratio < 1.02 && t.slice(0, 500) === h.slice(0, 500);
}

export const runFuzzCheck = async ({ uri, id, db, websiteId, createdAt, type, quickcheckId }) => {
  console.log(`Running fuzz check for ${uri}`)
  const [prevCheck] = await db.collection('checks')
    .find({ check: 'fuzz', websiteId })
    .sort({ createdAt: -1 })
    .limit(1)
    .toArray();

  const prevFiles = (prevCheck?.result?.details?.files || []).map(f => f.file)
  const file = 'fuzz_base.txt'
  const fuzzPath = path.join(process.cwd(), `utils/${file}`)
  const fuzzFile = fs.readFileSync(fuzzPath).toString()
  const fuzzFiles = fuzzFile.split('\n')
  const files = [...new Set([...fuzzFiles, ...prevFiles])]

  // Fetch homepage once to detect catch-all / SPA fallback behavior
  let homepageText = null;
  try {
    const homepageRes = await fetch(uri, { signal: AbortSignal.timeout(10000) });
    homepageText = await homepageRes.text();
  } catch (_) {}

  const limit = pLimit(20);
  const promises = files.map(file =>
    limit(async () => {
      try {
        const filename = file.startsWith('/') ? file.slice(1) : file;
        const res = await fetch(`${uri}/${filename}`, { method: 'head', signal: AbortSignal.timeout(8000) });
        if (res.status === 200) {
          const contentRes = await fetch(`${uri}/${filename}`, { signal: AbortSignal.timeout(8000) });
          const text = await contentRes.text();
          if (homepageText && isFallbackPage(text, homepageText)) {
            return { status: 200, file, isFallback: true };
          }
          return {
            status: 200,
            file,
            hasContent: text.trim().length > 0,
            probability404: get404Probability(text)
          };
        }
        return { status: res.status, file };
      } catch (err) {
        return { status: 500, file };
      }
    })
  );

  const results = await Promise.all(promises);

  const filesWithContent = results.filter(sc => sc.status === 200 && !sc.isFallback && sc.hasContent && sc.probability404 < 0.5);
  const result = {
    status: filesWithContent.length === 0 ? 'success' : 'fail',
    details: {
      files: filesWithContent
    },
  }

  await createCheckResult({ id, websiteId, createdAt, check: 'fuzz', result, quickcheckId, type })
}
