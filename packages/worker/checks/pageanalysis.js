import pLimit from 'p-limit'
import { createCheckResult } from '../db.js'

const STACK_TRACE_RE = /at Object\.<|at Module\.<|\.js:\d+:\d+|at async [A-Za-z]|node:internal\/|Error: Cannot find module/
const DIR_LISTING_RE = /Index of\s+\/|Directory listing for\s+\//i
const INTEGRITY_RE = /\bintegrity=/i
const CSRF_TOKEN_NAMES = ['_token', 'csrf_token', '_csrf', 'authenticity_token', '__requestverificationtoken']

function extractSriIssues(html, domain) {
  const issues = []
  const re = /<(?:script|link)\b[^>]+>/gi
  for (const match of html.matchAll(re)) {
    const tag = match[0]
    const urlMatch = tag.match(/(?:src|href)=["'](https?:\/\/[^"']+)["']/i)
    if (!urlMatch) continue
    if (urlMatch[1].includes(domain)) continue
    if (!INTEGRITY_RE.test(tag)) issues.push(urlMatch[1])
  }
  return [...new Set(issues)]
}

function extractCsrflessFormActions(html) {
  const issues = []
  const formRe = /<form\b[^>]*>/gi
  for (const match of html.matchAll(formRe)) {
    const openTag = match[0]
    if (!/method\s*=\s*["']?post["']?/i.test(openTag)) continue
    const bodyStart = match.index + openTag.length
    const bodyEnd = html.indexOf('</form>', bodyStart)
    const body = bodyEnd !== -1 ? html.slice(bodyStart, bodyEnd) : ''
    const hasCsrf = CSRF_TOKEN_NAMES.some(n =>
      body.toLowerCase().includes(`name="${n}"`) || body.toLowerCase().includes(`name='${n}'`)
    )
    if (!hasCsrf) {
      const actionMatch = openTag.match(/action=["']([^"']+)["']/i)
      issues.push(actionMatch ? actionMatch[1] : '(no action)')
    }
  }
  return issues
}

export const runPageAnalysisCheck = async ({ uri, id, websiteId, createdAt, quickcheckId, type }) => {
  console.log(`Running page analysis check for ${uri}`)

  const details = {
    verboseErrors: false,
    sriIssues: [],
    csrfIssues: [],
    dirListingIssues: [],
  }

  try {
    const domain = new URL(uri).hostname
    const mainRes = await fetch(uri, { redirect: 'follow', signal: AbortSignal.timeout(10000) })
    const html = await mainRes.text()

    details.sriIssues = extractSriIssues(html, domain)
    details.csrfIssues = extractCsrflessFormActions(html)

    // Directory listing — probe common upload/static paths
    const limit = pLimit(4)
    const dirPaths = ['/uploads/', '/files/', '/assets/', '/static/', '/backup/', '/data/']
    const dirResults = await Promise.all(
      dirPaths.map(path => limit(async () => {
        try {
          const res = await fetch(`${uri}${path}`, { signal: AbortSignal.timeout(5000) })
          if (res.ok) {
            const text = await res.text()
            if (DIR_LISTING_RE.test(text)) return path
          }
        } catch {}
        return null
      }))
    )
    details.dirListingIssues = dirResults.filter(Boolean)

    // Verbose error page — probe a random non-existent path
    const probe = `${uri}/statusscout-probe-${Math.random().toString(36).slice(2)}`
    try {
      const errRes = await fetch(probe, { signal: AbortSignal.timeout(8000) })
      const errText = await errRes.text()
      details.verboseErrors = STACK_TRACE_RE.test(errText)
    } catch {}

    const issueCount =
      (details.verboseErrors ? 1 : 0) +
      details.sriIssues.length +
      details.csrfIssues.length +
      details.dirListingIssues.length

    await createCheckResult({
      id, websiteId, createdAt, check: 'pageanalysis',
      result: { status: issueCount === 0 ? 'success' : 'fail', details },
      quickcheckId, type,
    })
  } catch (err) {
    console.error(`Error running page analysis for ${uri}:`, err.message)
  }
}
