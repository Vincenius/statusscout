import { LinkChecker } from 'linkinator';
import { createCheckResult } from '../db.js';

const fileRegex = /\.[a-z0-9]+([?#].*)?$/i;
const skipList = [] // todo dynamic
let crawlCount = 0;

export const runBrokenLinkCheck = async ({ uri, id, websiteId, createdAt, type, quickcheckId }) => {
  console.log(`Running broken link check for ${uri}`)
  const url = new URL(uri);
  const baseUrl = url.origin;
  const checker = new LinkChecker();
  const crawlLimit = type === 'free' ? 200 : 4000;

  const results = await checker.check({
    path: baseUrl,
    recurse: true,
    timeout: 15000, // 15 seconds timeout
    linksToSkip: (url) => {
      const isFile = fileRegex.test(url); // skip files
      const isBotProtection = /\/cdn-cgi\//i.test(url); // Cloudflare bot/email protection
      const skip = skipList.some(skip => url.includes(skip)) || isBotProtection;

      if (!skip && !isFile) {
        crawlCount++;
      }

      return Promise.resolve(skip || isFile || crawlCount >= crawlLimit);
    }
  });

  const result = {
    status: results.links.filter(r => r.status === 404 || r.status === 500).length > 0 ? 'fail' : 'success',
    details: results.links.filter(r => r.status === 404 || r.status === 500).map(l => ({
      url: l.url,
      status: l.status,
      parent: l.parent
    }))
  }

  await createCheckResult({ id, websiteId, createdAt, check: 'links', result, quickcheckId, type })
}
