import { createCheckResult } from '../db.js'

export const runUptimeCheck = async ({ uri, id, websiteId, createdAt, quickcheckId, type }) => {
  console.log(`Running uptime check for ${uri}`)
  const result = {
    status: '', // success or fail
    details: {},
  }

  try {
    const start = Date.now()
    const response = await fetch(uri, { method: 'GET', signal: AbortSignal.timeout(10000) })
    const duration = Date.now() - start

    if (response.ok) {
      result.status = 'success'
    } else {
      result.status = 'fail'
    }

    result.details = {
      statusCode: response.status,
      statusText: response.statusText,
      responseTimeMs: duration,
    }
  } catch (err) {
    console.error(`Error fetching ${uri}:`, err.message)

    result.status = 'fail'
    result.details = {
      error: err.message,
    }
  }

  await createCheckResult({ id, websiteId, createdAt, check: 'uptime', result, quickcheckId, type })

  return result.status;
}
