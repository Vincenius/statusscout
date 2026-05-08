import { dnsChecksInfo } from './dns.js'

const getIssues = ({ checks, type, getCurrIssues }) => {
  const filteredChecks = checks
    .filter(c => c.check === type)
    .sort((d1, d2) => new Date(d1.createdAt) - new Date(d2.createdAt))

  const issues = filteredChecks.reduce((acc, curr) => {
    const currIssues = getCurrIssues(curr)
    const newIssues = currIssues.filter(title => !acc.find(issue => issue.title === title && !issue.resolvedAt))
    const oldIssues = acc.map(i => ({
      ...i,
      resolvedAt: i.resolvedAt
        ? i.resolvedAt
        : currIssues.includes(i.title)
          ? null
          : curr.createdAt
    }))

    return [
      ...oldIssues,
      ...newIssues.map(title => ({
        createdAt: curr.createdAt,
        check: curr.check,
        title,
        jobId: curr.jobId,
      }))
    ]
  }, [])

  const firstJobId = filteredChecks.length && filteredChecks[0].jobId

  // Exclude issues from the first check to avoid showing initial issues
  return issues.filter(i => i.jobId !== firstJobId)
}

const getCustomIssues = ({ checks }) => {
  const customChecks = checks.filter(c => c.check === 'custom')
  const groupedChecks = customChecks.reduce((acc, curr) => {
    if (!curr.flowId) return acc
    if (acc[curr.flowId]) {
      acc[curr.flowId].push(curr)
    } else {
      acc[curr.flowId] = [curr]
    }
    return acc
  }, {})

  const customIssues = Object.values(groupedChecks).map(flowChecks => {
    return getIssues({
      checks: flowChecks,
      type: 'custom',
      getCurrIssues: curr => {
        return (curr?.result?.status === 'fail' ? [curr?.result?.name] : [])
      }
    })
  }).flat()

  return customIssues
}

export const getIssueHistory = (checks) => {
  const sslIssues = getIssues({ checks, type: 'ssl', getCurrIssues: curr => (curr?.result?.details?.valid ? [] : ['Invalid SSL Certificate']) })
  const headerIssues = getIssues({ checks, type: 'headers', getCurrIssues: curr => (curr?.result?.details?.missingHeaders || []) })
  const cookieIssues = getIssues({ checks, type: 'cookies', getCurrIssues: curr => (curr?.result?.details?.issues || []).map(i => `${i.cookie}: missing ${i.missingFlags.join(', ')}`) })
  const fuzzIssues = getIssues({ checks, type: 'fuzz', getCurrIssues: curr => (curr?.result?.details?.files || []).map(i => i.file) })
  const dnsIssues = getIssues({ checks, type: 'dns', getCurrIssues: curr => (Object.entries(curr?.result?.details || {}) || []).filter(([key, val]) => !val.success && key !== 'subdomains').map(([key]) => dnsChecksInfo[key].name) })
  const subdomainIssues = getIssues({
    checks, type: 'dns',
    getCurrIssues: curr => ((Object.entries(curr?.result?.details || {}) || [])
      .filter(([key, val]) => !val.success && key === 'subdomains')[0]?.[1]?.issues || [])
      .map((subdomain) => subdomain.text)
  })
  const mixedContentIssues = getIssues({ checks, type: 'mixedcontent', getCurrIssues: curr => (curr?.result?.details?.issues || []) })
  const pageAnalysisIssues = getIssues({
    checks, type: 'pageanalysis',
    getCurrIssues: curr => {
      const d = curr?.result?.details || {}
      const issues = []
      if (d.verboseErrors) issues.push('Verbose error messages exposed')
      issues.push(...(d.sriIssues || []).map(url => `Missing SRI: ${url}`))
      issues.push(...(d.csrfIssues || []).map(action => `Form missing CSRF protection: ${action}`))
      issues.push(...(d.dirListingIssues || []).map(path => `Directory listing exposed: ${path}`))
      return issues
    }
  })
  const apiDocsIssues = getIssues({ checks, type: 'apidocs', getCurrIssues: curr => (curr?.result?.details?.exposed || []).map(path => `API documentation exposed: ${path}`) })
  const linkIssues = getIssues({ checks, type: 'links', getCurrIssues: curr => (curr?.result?.details || []).map(i => `${i.parent} -> ${i.url}`) })
  const customIssues = getCustomIssues({ checks })

  const allIssues = [...sslIssues, ...headerIssues, ...cookieIssues, ...fuzzIssues, ...dnsIssues, ...subdomainIssues, ...mixedContentIssues, ...pageAnalysisIssues, ...apiDocsIssues, ...linkIssues, ...customIssues]
  const checkDates = checks.map(c => c.createdAt)
  const uniqueDates = [...new Set(checkDates)].sort((a, b) => a - b)

  const issueHistory = uniqueDates.map(date => {
    const issues = allIssues.filter(i => i.createdAt === date)
    const jobId = checks.find(c => c.createdAt === date)?.jobId
    return {
      createdAt: date,
      jobId,
      issues,
      result: {
        status: issues.length === 0
          ? 'success'
          : issues.filter(i => i.check === 'ssl').length // handle error types
            ? 'error'
            : 'warning'
      }
    }
  })

  return issueHistory
}