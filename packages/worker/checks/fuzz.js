import fs from 'fs'
import path from 'path'
import pLimit from 'p-limit';
import { createCheckResult } from '../db.js'

function get404Probability(html) {
  if (!html || !html.trim()) return 1;

  const text = html.toLowerCase();

  let score = 0;

  // 1. keyword signals
  const signals = ["404", "not found", "page not found", "error", "oops", "we can't find", "can't be found", "doesn't exist"];
  for (const s of signals) {
    if (text.includes(s)) score += 0.3;
  }

  // 3. Title contains 404
  const title = text.match(/<title[^>]*>(.*?)<\/title>/);
  if (title && title[1].includes("404")) score += 0.5;

  return Math.min(1, score);
}

export const runFuzzCheck = async ({ uri, id, db, websiteId, createdAt, type, quickcheckId }) => {
  console.log(`Running fuzz check for ${uri}`)
  const [prevCheck] = await db.collection('checks')
    .find({ check: 'fuzz', websiteId })
    .sort({ createdAt: -1 })
    .limit(1)
    .toArray();

  const prevFiles = (prevCheck?.result?.details?.files || []).map(f => f.file)
  const file = type === 'free' ? 'fuzz_base.txt' : 'fuzz_all.txt' // https://github.com/Bo0oM/fuzz.txt
  const fuzzPath = path.join(process.cwd(), `utils/${file}`)
  const fuzzFile = fs.readFileSync(fuzzPath).toString()
  const fuzzFiles = fuzzFile.split('\n')
  const files = [...new Set([...fuzzFiles, ...prevFiles])]

  // split into batches
  const limit = pLimit(20); // max 10 concurrent requests
  const promises = files.map(file =>
    limit(async () => {
      try {
        const filename = file.startsWith('/') ? file.slice(1) : file;
        const res = await fetch(`${uri}/${filename}`, { method: 'head' });
        if (res.status === 200) {
          const contentRes = await fetch(`${uri}/${filename}`);
          const text = await contentRes.text();
          return {
            status: 200,
            file,
            hasContent: text.trim().length > 0,
            probability404: get404Probability(text)
            // todo compare with landing page to see if landing is rendered as fallback 
          };
        }
        return { status: res.status, file };
      } catch (err) {
        return { status: 500, file };
      }
    })
  );

  const results = await Promise.all(promises);

  const filesWithContent = results.filter(sc => sc.status === 200 && sc.hasContent && sc.probability404 < 0.5);
  const result = {
    status: filesWithContent.length === 0 ? 'success' : 'fail',
    details: {
      files: filesWithContent
    },
  }

  await createCheckResult({ id, websiteId, createdAt, check: 'fuzz', result, quickcheckId, type })
}
