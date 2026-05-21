import { connectDB } from '../db.js'
import { computeSecurityScore } from '@statusscout/shared'

const GRADE_COLORS = {
  A: '#2f9e44',
  B: '#099268',
  C: '#e67700',
  D: '#e8590c',
  F: '#c92a2a',
}

function buildBadgeSvg(rightText, rightColor) {
  const leftText = 'StatusScout'
  const leftWidth = 80
  const rightWidth = 120
  const totalWidth = leftWidth + rightWidth

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20" role="img" aria-label="${leftText}: ${rightText}">
  <title>${leftText}: ${rightText}</title>
  <defs>
    <linearGradient id="g" x2="0" y2="100%">
      <stop offset="0" stop-color="#aaa" stop-opacity=".1"/>
      <stop offset="1" stop-opacity=".1"/>
    </linearGradient>
    <clipPath id="r"><rect width="${totalWidth}" height="20" rx="3" fill="#fff"/></clipPath>
  </defs>
  <g clip-path="url(#r)">
    <rect width="${leftWidth}" height="20" fill="#555"/>
    <rect x="${leftWidth}" width="${rightWidth}" height="20" fill="${rightColor}"/>
    <rect width="${totalWidth}" height="20" fill="url(#g)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
    <text x="${leftWidth / 2}" y="14.5" fill="#010101" fill-opacity=".3">${leftText}</text>
    <text x="${leftWidth / 2}" y="13.5">${leftText}</text>
    <text x="${leftWidth + rightWidth / 2}" y="14.5" fill="#010101" fill-opacity=".3">${rightText}</text>
    <text x="${leftWidth + rightWidth / 2}" y="13.5">${rightText}</text>
  </g>
</svg>`
}

async function findPublicWebsite(db, domain) {
  return db.collection('websites').findOne({
    domain: { $in: [`http://${domain}`, `https://${domain}`] },
    publicReport: true,
    deleted: { $ne: true },
  })
}

async function getLatestChecks(db, websiteId, checkTypes) {
  const checks = await db.collection('checks').aggregate([
    { $match: { websiteId, check: { $in: checkTypes } } },
    { $sort: { check: 1, createdAt: -1 } },
    { $group: { _id: '$check', entries: { $push: '$$ROOT' } } },
    { $project: { _id: 0, check: '$_id', entries: { $slice: ['$entries', 1] } } },
    { $unwind: '$entries' },
    { $replaceRoot: { newRoot: '$entries' } },
  ]).toArray()
  return checks
}

export default async function publicReportRoutes(fastify, opts) {
  fastify.get('/public-report/:domain', { config: { auth: false } }, async (request, reply) => {
    try {
      const { domain } = request.params
      const db = await connectDB()
      const website = await findPublicWebsite(db, domain)

      if (!website) {
        reply.code(404).send({ error: 'Not found' })
        return
      }

      const checkTypes = ['ssl', 'headers', 'fuzz', 'dns', 'cookies', 'mixedcontent', 'pageanalysis', 'apidocs']
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const thirtyDaysAgoIso = thirtyDaysAgo.toISOString()

      const checks = await db.collection('checks').aggregate([
        { $match: { websiteId: website._id, check: { $in: checkTypes }, createdAt: { $gte: thirtyDaysAgoIso } } },
        { $sort: { check: 1, createdAt: -1 } },
        { $group: { _id: '$check', entries: { $push: '$$ROOT' } } },
        { $project: { _id: 0, check: '$_id', entries: { $slice: ['$entries', 200] } } },
        { $unwind: '$entries' },
        { $replaceRoot: { newRoot: '$entries' } },
      ]).toArray()

      const sanitized = checks.map(({ check, result, createdAt }) => ({ check, result, createdAt }))

      return { domain: website.domain, checks: sanitized }
    } catch (e) {
      console.error(e)
      reply.code(500).send({ error: 'Internal server error' })
    }
  })

  fastify.get('/badge/quickcheck/:id', { config: { auth: false } }, async (request, reply) => {
    reply.header('Content-Type', 'image/svg+xml')
    reply.header('Cache-Control', 'public, max-age=3600')

    try {
      const { id } = request.params
      const db = await connectDB()

      const checkTypes = ['ssl', 'headers', 'fuzz', 'dns', 'cookies', 'mixedcontent', 'pageanalysis', 'apidocs']
      const checks = await db.collection('checks')
        .find({ quickcheckId: id, check: { $in: checkTypes } })
        .toArray()

      if (!checks.length) {
        return buildBadgeSvg('unknown', '#9e9e9e')
      }

      const latestByType = {}
      for (const check of checks) {
        if (!latestByType[check.check] || check.createdAt > latestByType[check.check].createdAt) {
          latestByType[check.check] = check
        }
      }

      const getCheck = (type) => latestByType[type] || null
      const sslCheck = getCheck('ssl')
      const fuzzCheck = getCheck('fuzz')
      const headersCheck = getCheck('headers')
      const dnsCheck = getCheck('dns')
      const cookieCheck = getCheck('cookies')
      const mixedContentCheck = getCheck('mixedcontent')
      const pageAnalysisCheck = getCheck('pageanalysis')
      const apiDocsCheck = getCheck('apidocs')
      const exposedFiles = fuzzCheck?.result?.details?.files || []
      const missingHeaders = headersCheck?.result?.details?.missingHeaders || []

      const { score, grade } = computeSecurityScore({
        sslCheck, fuzzCheck, headersCheck, dnsCheck, cookieCheck,
        mixedContentCheck, pageAnalysisCheck, apiDocsCheck,
        exposedFiles, missingHeaders,
      })

      const color = GRADE_COLORS[grade] || '#555'
      return buildBadgeSvg(`Grade ${grade} · ${score}/100`, color)
    } catch (e) {
      console.error(e)
      return buildBadgeSvg('error', '#9e9e9e')
    }
  })

  fastify.get('/badge/:domain', { config: { auth: false } }, async (request, reply) => {
    reply.header('Content-Type', 'image/svg+xml')
    reply.header('Cache-Control', 'public, max-age=3600')

    try {
      const { domain } = request.params
      const db = await connectDB()
      const website = await findPublicWebsite(db, domain)

      if (!website) {
        return buildBadgeSvg('unknown', '#9e9e9e')
      }

      const checkTypes = ['ssl', 'headers', 'fuzz', 'dns', 'cookies', 'mixedcontent', 'pageanalysis', 'apidocs']
      const checks = await getLatestChecks(db, website._id, checkTypes)

      const getCheck = (type) => checks.find(c => c.check === type) || null
      const sslCheck = getCheck('ssl')
      const fuzzCheck = getCheck('fuzz')
      const headersCheck = getCheck('headers')
      const dnsCheck = getCheck('dns')
      const cookieCheck = getCheck('cookies')
      const mixedContentCheck = getCheck('mixedcontent')
      const pageAnalysisCheck = getCheck('pageanalysis')
      const apiDocsCheck = getCheck('apidocs')
      const exposedFiles = fuzzCheck?.result?.details?.files || []
      const missingHeaders = headersCheck?.result?.details?.missingHeaders || []

      const { score, grade } = computeSecurityScore({
        sslCheck, fuzzCheck, headersCheck, dnsCheck, cookieCheck,
        mixedContentCheck, pageAnalysisCheck, apiDocsCheck,
        exposedFiles, missingHeaders,
      })

      const color = GRADE_COLORS[grade] || '#555'
      return buildBadgeSvg(`Grade ${grade} · ${score}/100`, color)
    } catch (e) {
      console.error(e)
      return buildBadgeSvg('error', '#9e9e9e')
    }
  })
}
