import { createCheckResult } from '../db.js'

// https://chatgpt.com/c/6870d745-5aa8-8013-bc17-69fa16456d9a
export const runHeaderCheck = async ({ uri, id, websiteId, createdAt, quickcheckId, type }) => {
  console.log(`Running header check for ${uri}`)
  const recommendedHeaders = [
    'content-security-policy',
    'strict-transport-security',
    'x-content-type-options',
    'x-frame-options',
    'referrer-policy',
  ];

  const optionalHeaders = [
    'permissions-policy',
    'cross-origin-resource-policy',
    'cross-origin-opener-policy',
    'cross-origin-embedder-policy',
  ];

  try {
    const res = await fetch(uri, { redirect: 'follow' });
    const headers = {};

    for (const [key, value] of res.headers.entries()) {
      headers[key.toLowerCase()] = value;
    }

    const missingHeaders = []
    recommendedHeaders.forEach(name => {
      if (!headers[name]) {
        missingHeaders.push(name)
      }
    });

    const missingOptionalHeaders = []
    optionalHeaders.forEach(name => {
      if (!headers[name]) {
        missingOptionalHeaders.push(name)
      }
    });

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
      status: missingHeaders.length === 0 && !corsWildcard && versionDisclosure.length === 0 ? 'success' : 'fail',
      details: {
        missingHeaders,
        missingOptionalHeaders,
        corsWildcard,
        versionDisclosure,
        httpsRedirect,
      },
    }
    await createCheckResult({ id, websiteId, createdAt, check: 'headers', result, quickcheckId, type })
  } catch (err) {
    console.error(`Error fetching ${uri}:`, err.message);
  }
}
