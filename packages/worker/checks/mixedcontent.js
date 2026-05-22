import { createCheckResult } from '../db.js'

// Matches http:// URLs in common HTML resource attributes and CSS url()
const HTTP_RESOURCE_RE = /(?:src|href|action|srcset)=["']http:\/\/[^"']+["']|url\(["']?http:\/\/[^"')]+["']?\)/gi

export const runMixedContentCheck = async ({ uri, id, websiteId, createdAt, quickcheckId, type }) => {
  console.log(`Running mixed content check for ${uri}`)

  if (!uri.startsWith('https://')) {
    // Mixed content is only a concern on HTTPS pages
    const result = { status: 'success', details: { issues: [], skipped: true } }
    await createCheckResult({ id, websiteId, createdAt, check: 'mixedcontent', result, quickcheckId, type })
    return
  }

  try {
    const res = await fetch(uri, { redirect: 'follow', signal: AbortSignal.timeout(10000) })
    const html = await res.text()

    const issues = new Set()

    for (const match of html.matchAll(HTTP_RESOURCE_RE)) {
      const urlMatch = match[0].match(/http:\/\/[^"'\s)]+/)
      if (urlMatch) issues.add(urlMatch[0])
    }

    const result = {
      status: issues.size === 0 ? 'success' : 'fail',
      details: { issues: [...issues] },
    }

    await createCheckResult({ id, websiteId, createdAt, check: 'mixedcontent', result, quickcheckId, type })
  } catch (err) {
    console.error(`Error checking mixed content for ${uri}:`, err.message)
  }
}
