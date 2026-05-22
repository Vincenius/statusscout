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
  email:   { label: 'E-Mail Address',    placeholder: 'you@example.com',                         type: 'email', name: 'E-Mail',  color: 'blue'   },
  sms:     { label: 'Phone Number',      placeholder: '+1 234 567 8900',                          type: 'text',  name: 'SMS',     color: 'teal'   },
  ntfy:    { label: 'ntfy Topic',        placeholder: 'your-topic',                               type: 'text',  name: 'ntfy',    color: 'orange' },
  discord: { label: 'Discord Webhook URL', placeholder: 'https://discord.com/api/webhooks/…',    type: 'text',  name: 'Discord', color: 'violet' },
  slack:   { label: 'Slack Webhook URL', placeholder: 'https://hooks.slack.com/services/…',      type: 'text',  name: 'Slack',   color: 'green'  },
}