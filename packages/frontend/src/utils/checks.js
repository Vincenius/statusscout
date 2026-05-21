const byDate = (d1, d2) => new Date(d2.createdAt) - new Date(d1.createdAt)
const latest = (checks, type) => checks.filter(d => d.check === type).sort(byDate)[0]

export const getRecentChecks = (checks) => {
  return {
    fuzzCheck: latest(checks, 'fuzz'),
    headersCheck: latest(checks, 'headers'),
    sslCheck: latest(checks, 'ssl'),
    dnsCheck: latest(checks, 'dns'),
    cookieCheck: latest(checks, 'cookies'),
    mixedContentCheck: latest(checks, 'mixedcontent'),
    pageAnalysisCheck: latest(checks, 'pageanalysis'),
    apiDocsCheck: latest(checks, 'apidocs'),
    customChecks: checks.filter(d => d.check === 'custom').sort(byDate),
  }
}

export const notificationMap = {
  email: { label: 'E-Mail Address', placeholder: 'you@example.com', type: 'email' },
  sms: { label: 'Phone Number', placeholder: '123-456-7890', type: 'text' },
  ntfy: { label: 'ntfy Topic', placeholder: 'your-topic', type: 'text' },
}