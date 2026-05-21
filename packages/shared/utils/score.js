export function computeSecurityScore({ sslCheck, fuzzCheck, headersCheck, dnsCheck, cookieCheck, mixedContentCheck, pageAnalysisCheck, apiDocsCheck, exposedFiles, missingHeaders }) {
  let score = 100
  const issues = { critical: 0, high: 0, medium: 0, low: 0 }

  if (sslCheck && sslCheck.result.status !== 'success') {
    score -= 30
    issues.critical++
  }

  if ((apiDocsCheck?.result.details.exposed || []).length > 0) {
    score -= 20
    issues.high++
  }

  if (pageAnalysisCheck?.result.details.verboseErrors) {
    score -= 15
    issues.high++
  }

  if (headersCheck?.result.details.httpsRedirect &&
      !headersCheck.result.details.httpsRedirect.redirects &&
      !headersCheck.result.details.httpsRedirect.connectionFailed) {
    score -= 12
    issues.high++
  }

  if (headersCheck?.result.details.corsWildcard) {
    score -= 10
    issues.high++
  }

  if (fuzzCheck && exposedFiles.length > 0) {
    score -= Math.min(5 * exposedFiles.length, 15)
    issues.medium++
  }

  const versionDisclosures = headersCheck?.result.details.versionDisclosure?.length || 0
  if (versionDisclosures > 0) {
    score -= Math.min(5 * versionDisclosures, 10)
    issues.medium++
  }

  const cookieIssueCount = cookieCheck?.result.details.issues.length || 0
  if (cookieIssueCount > 0) {
    score -= Math.min(3 * cookieIssueCount, 10)
    issues.medium++
  }

  const mixedContentCount = mixedContentCheck?.result.details.issues.length || 0
  if (mixedContentCount > 0 && !mixedContentCheck?.result.details.skipped) {
    score -= Math.min(3 * mixedContentCount, 10)
    issues.medium++
  }

  if (missingHeaders.length > 0) {
    score -= Math.min(2 * missingHeaders.length, 8)
    issues.low++
  }

  if (dnsCheck) {
    const dnsIssueCount = Object.values(dnsCheck.result.details).filter(d => !d.success).length
    if (dnsIssueCount > 0) {
      score -= Math.min(2 * dnsIssueCount, 6)
      issues.low++
    }
  }

  const sriCount = pageAnalysisCheck?.result.details.sriIssues?.length || 0
  const csrfCount = pageAnalysisCheck?.result.details.csrfIssues?.length || 0
  const dirCount = pageAnalysisCheck?.result.details.dirListingIssues?.length || 0
  if (sriCount + csrfCount + dirCount > 0) {
    score -= Math.min(3 * (sriCount + csrfCount + dirCount), 8)
    issues.low++
  }

  score = Math.max(0, score)

  let grade, label, color
  if (score >= 90) { grade = 'A'; label = 'Excellent'; color = 'green' }
  else if (score >= 75) { grade = 'B'; label = 'Good'; color = 'teal' }
  else if (score >= 55) { grade = 'C'; label = 'Fair'; color = 'yellow' }
  else if (score >= 35) { grade = 'D'; label = 'Poor'; color = 'orange' }
  else { grade = 'F'; label = 'Critical'; color = 'red' }

  return { score, grade, label, color, issues }
}
