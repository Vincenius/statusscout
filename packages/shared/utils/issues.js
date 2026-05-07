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
  const fuzzIssues = getIssues({ checks, type: 'fuzz', getCurrIssues: curr => (curr?.result?.details?.files || []).map(i => i.file) })
  const seoIssues = getIssues({ checks, type: 'seo', getCurrIssues: curr => (curr?.result?.details?.items || []).map(i => i.title) })
  const a11yIssues = getIssues({ checks, type: 'a11y', getCurrIssues: curr => (curr?.result?.details?.items || []).map(i => i.title) })
  const linkIssues = getIssues({ checks, type: 'links', getCurrIssues: curr => (curr?.result?.details || []).map(i => `${i.parent} -> ${i.url}`) })
  const dnsIssues = getIssues({ checks, type: 'dns', getCurrIssues: curr => (Object.entries(curr?.result?.details || {}) || []).filter(([key, val]) => !val.success && key !== 'subdomains').map(([key]) => dnsChecksInfo[key].name) })
  const subdomainIssues = getIssues({
    checks, type: 'dns',
    getCurrIssues: curr => ((Object.entries(curr?.result?.details || {}) || [])
      .filter(([key, val]) => !val.success && key === 'subdomains')[0]?.[1]?.issues || [])
      .map((subdomain) => subdomain.text)
  })
  const customIssues = getCustomIssues({ checks })
  // TODO performance?

  const allIssues = [...sslIssues, ...headerIssues, ...fuzzIssues, ...seoIssues, ...a11yIssues, ...linkIssues, ...dnsIssues, ...subdomainIssues, ...customIssues]
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