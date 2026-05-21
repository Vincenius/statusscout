import { createCheckResult } from '../db.js'

// Returns an issue string if the value is insecure, null if OK
function validateHSTS(value) {
  const m = value.match(/max-age=(\d+)/i)
  if (!m) return 'Missing max-age directive'
  const maxAge = parseInt(m[1], 10)
  if (maxAge === 0) return 'HSTS disabled (max-age=0)'
  if (maxAge < 2592000) return `max-age too short (${maxAge}s) — minimum 30 days recommended`
  if (maxAge < 15768000) return `max-age below 6 months (${maxAge}s) — Mozilla Observatory requires ≥ 15768000s`
  return null
}

function validateCSP(value) {
  const directives = {}
  for (const part of value.split(';')) {
    const trimmed = part.trim()
    if (!trimmed) continue
    const [name, ...tokens] = trimmed.split(/\s+/)
    directives[name.toLowerCase()] = tokens
  }
  // Use explicit script-src, or fall back to default-src
  const scriptSrc = directives['script-src'] ?? directives['default-src'] ?? []
  const issues = []
  if (scriptSrc.includes("'unsafe-inline'")) issues.push("'unsafe-inline' in script-src (XSS risk; nonces/hashes can override this)")
  if (scriptSrc.includes("'unsafe-eval'")) issues.push("'unsafe-eval' in script-src (code injection risk)")
  return issues.length > 0 ? issues.join('; ') : null
}

function validateReferrerPolicy(value) {
  if (value.toLowerCase().trim() === 'unsafe-url') return "'unsafe-url' leaks full URLs including query strings to all third parties"
  return null
}

function validateXContentTypeOptions(value) {
  if (value.toLowerCase().trim() !== 'nosniff') return `must be 'nosniff', got '${value}'`
  return null
}

function validateXFrameOptions(value) {
  const v = value.toUpperCase().trim()
  if (v.startsWith('ALLOW-FROM')) return 'ALLOW-FROM is deprecated — use CSP frame-ancestors instead'
  if (v !== 'DENY' && v !== 'SAMEORIGIN') return `must be DENY or SAMEORIGIN, got '${value}'`
  return null
}

const valueValidators = {
  'strict-transport-security': validateHSTS,
  'content-security-policy': validateCSP,
  'referrer-policy': validateReferrerPolicy,
  'x-content-type-options': validateXContentTypeOptions,
  'x-frame-options': validateXFrameOptions,
}

export const runHeaderCheck = async ({ uri, id, websiteId, createdAt, quickcheckId, type }) => {
  console.log(`Running header check for ${uri}`)
  const recommendedHeaders = [
    'content-security-policy',
    'strict-transport-security',
    'x-content-type-options',
    'x-frame-options',
    'referrer-policy',
  ]

  const optionalHeaders = [
    'permissions-policy',
    'cross-origin-resource-policy',
    'cross-origin-opener-policy',
    'cross-origin-embedder-policy',
  ]

  try {
    const res = await fetch(uri, { redirect: 'follow' })
    const headers = {}
    for (const [key, value] of res.headers.entries()) {
      headers[key.toLowerCase()] = value
    }

    const missingHeaders = []
    recommendedHeaders.forEach(name => {
      if (!headers[name]) missingHeaders.push(name)
    })

    // Check value quality for headers that ARE present
    const misconfiguredHeaders = []
    recommendedHeaders.forEach(name => {
      if (!headers[name]) return
      const validator = valueValidators[name]
      if (!validator) return
      const issue = validator(headers[name])
      if (issue) misconfiguredHeaders.push({ name, value: headers[name], issue })
    })

    const missingOptionalHeaders = []
    optionalHeaders.forEach(name => {
      if (!headers[name]) missingOptionalHeaders.push(name)
    })

    const corsHeader = headers['access-control-allow-origin']
    const corsWildcard = corsHeader === '*'

    // Version disclosure — flag exact version numbers in Server, always flag X-Powered-By
    const versionDisclosure = []
    const serverHeader = headers['server'] || ''
    const poweredByHeader = headers['x-powered-by'] || ''
    if (serverHeader && /\d+\.\d+/.test(serverHeader)) {
      versionDisclosure.push({ header: 'Server', value: serverHeader })
    }
    if (poweredByHeader) {
      versionDisclosure.push({ header: 'X-Powered-By', value: poweredByHeader })
    }

    // HTTP → HTTPS redirect — only on full/free to avoid extra latency on quick checks
    let httpsRedirect = null
    if (uri.startsWith('https://') && type !== 'quick') {
      const httpUri = uri.replace(/^https:\/\//, 'http://')
      try {
        const httpRes = await fetch(httpUri, {
          redirect: 'manual',
          signal: AbortSignal.timeout(5000),
        })
        const location = httpRes.headers.get('location') || ''
        httpsRedirect = {
          redirects: (httpRes.status === 301 || httpRes.status === 302 || httpRes.status === 307 || httpRes.status === 308) && location.startsWith('https://'),
          isPermanent: httpRes.status === 301 || httpRes.status === 308,
          connectionFailed: false,
        }
      } catch {
        httpsRedirect = { redirects: false, isPermanent: false, connectionFailed: true }
      }
    }

    const result = {
      status: missingHeaders.length === 0 && misconfiguredHeaders.length === 0 && !corsWildcard && versionDisclosure.length === 0 ? 'success' : 'fail',
      details: {
        missingHeaders,
        misconfiguredHeaders,
        missingOptionalHeaders,
        corsWildcard,
        versionDisclosure,
        httpsRedirect,
      },
    }
    await createCheckResult({ id, websiteId, createdAt, check: 'headers', result, quickcheckId, type })
  } catch (err) {
    console.error(`Error fetching ${uri}:`, err.message)
  }
}
