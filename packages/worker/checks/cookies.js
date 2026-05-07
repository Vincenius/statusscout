import { createCheckResult } from '../db.js'

export const runCookieCheck = async ({ uri, id, websiteId, createdAt, quickcheckId, type }) => {
  console.log(`Running cookie check for ${uri}`)

  try {
    const res = await fetch(uri, { redirect: 'follow' })

    // getSetCookie() returns all Set-Cookie values as an array (Node.js 18.14.1+)
    const setCookieHeaders = res.headers.getSetCookie?.() ?? []

    const issues = []

    for (const cookieStr of setCookieHeaders) {
      const lower = cookieStr.toLowerCase()
      const name = cookieStr.split('=')[0].trim()

      const missingFlags = []
      if (!lower.includes('httponly')) missingFlags.push('HttpOnly')
      if (!lower.includes('secure')) missingFlags.push('Secure')
      if (!lower.includes('samesite')) missingFlags.push('SameSite')

      if (missingFlags.length > 0) {
        issues.push({ cookie: name, missingFlags })
      }
    }

    const result = {
      status: issues.length === 0 ? 'success' : 'fail',
      details: { issues, cookieCount: setCookieHeaders.length },
    }

    await createCheckResult({ id, websiteId, createdAt, check: 'cookies', result, quickcheckId, type })
  } catch (err) {
    console.error(`Error checking cookies for ${uri}:`, err.message)
  }
}
