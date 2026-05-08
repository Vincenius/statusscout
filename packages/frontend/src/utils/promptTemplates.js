import { dnsChecksInfo } from '@statusscout/shared'

export function generateSSLPrompt(domain, sslDetails) {
  const validTo = sslDetails?.validTo ? new Date(sslDetails.validTo).toLocaleDateString() : null
  const isExpired = validTo && new Date(sslDetails.validTo) < new Date()
  const noCert = !sslDetails?.validTo

  let diagnosis
  if (isExpired) {
    diagnosis = `The certificate expired on ${validTo}. This usually means auto-renewal failed (e.g. Certbot/Let's Encrypt) or the cert was never renewed manually.`
  } else if (noCert) {
    diagnosis = `No certificate was found — the connection may have failed, or SSL is not configured at all on this server.`
  } else {
    diagnosis = `The certificate exists (valid until ${validTo}) but is being rejected. Common causes: it's self-signed, the domain name doesn't match the cert's CN/SAN, or the certificate chain is broken (missing intermediate cert).`
  }

  return `My website ${domain} has an SSL certificate issue.
${diagnosis}

Figure out where my site is hosted and how SSL is managed by reading my codebase (config files, deployment configs, nginx/Apache config, docker-compose, CI scripts, etc.), then walk me through the fix. If you can't tell from the code, ask me.`
}

export function generateHeadersPrompt(domain, missingHeaders) {
  const headerList = missingHeaders.map(h => `- ${h}`).join('\n')

  return `My website ${domain} is missing these HTTP security headers:

${headerList}

Figure out which framework or server I'm using by reading my codebase (package.json, config files, etc.), then show me how to add all the missing headers. If you can't tell, ask me.`
}

export function generateHeaderWarningsPrompt(domain, details) {
  const warnings = []

  if (details.versionDisclosure?.length) {
    const headers = details.versionDisclosure.map(v => `${v.header}: ${v.value}`).join(', ')
    warnings.push(`- Version disclosure: ${headers}`)
  }

  if (details.httpsRedirect && !details.httpsRedirect.redirects && !details.httpsRedirect.connectionFailed) {
    warnings.push(`- HTTP is not redirecting to HTTPS`)
  }

  if (details.corsWildcard) {
    warnings.push(`- CORS wildcard: Access-Control-Allow-Origin: * (note: this is intentional for fully public APIs — before fixing, check whether this API is meant to be called from any origin or only specific ones)`)
  }

  return `My website ${domain} has these HTTP header issues:

${warnings.join('\n')}

Figure out which framework or server I'm using by reading my codebase, then show me the code or config to fix each one. If you can't tell, ask me.`
}

const CRITICAL_FUZZ_PATTERNS = ['.env', 'wp-config', 'config.php', '.git/', 'phpinfo', '.htpasswd', 'id_rsa', 'database.yml', 'credentials', 'secrets', '.pem', '.key', '.sql', 'backup', 'dump', 'passwd', 'shadow', 'web.config', 'settings.py', 'application.yml', 'application.properties']

export function generateFuzzPrompt(domain, exposedFiles) {
  const isCritical = f => CRITICAL_FUZZ_PATTERNS.some(p => f.toLowerCase().includes(p))
  const critical = exposedFiles.filter(f => isCritical(f.file))
  const standard = exposedFiles.filter(f => !isCritical(f.file))

  const fmt = files => files.map(f => `- ${domain}/${f.file}`).join('\n')

  const sections = []
  if (critical.length) sections.push(`CRITICAL — fix immediately (may expose secrets or credentials):\n${fmt(critical)}`)
  if (standard.length) sections.push(`Standard — should be blocked:\n${fmt(standard)}`)

  return `These files are publicly accessible on ${domain}:

${sections.join('\n\n')}

Figure out which web server or hosting setup I'm using by reading my codebase and config files, then show me how to block access to each one. If you can't tell, ask me. Also tell me which of these files I should delete entirely rather than just block.`
}

export function generateLinksPrompt(domain, brokenLinks) {
  const isInternal = url => url.includes(domain)
  const internal = brokenLinks.filter(l => isInternal(l.url))
  const external = brokenLinks.filter(l => !isInternal(l.url))

  const fmt = list => list.slice(0, 20).map(l => `- [${l.status}] ${l.url} (on: ${l.parent})`).join('\n')
  const overflow = (list, label) => list.length > 20 ? `...and ${list.length - 20} more ${label} links.` : ''

  const sections = []
  if (internal.length) {
    sections.push(`Internal broken links — find and fix or remove these in my codebase:\n${fmt(internal)}${overflow(internal, 'internal')}`)
  }
  if (external.length) {
    sections.push(`External broken links — these point to dead third-party URLs; I need to update the destination or remove the link:\n${fmt(external)}${overflow(external, 'external')}`)
  }

  return `${domain} has broken links:

${sections.join('\n\n')}

For internal links, search my codebase for the URLs and fix them. For external links, tell me which ones are worth replacing vs removing.`
}

export function generateDnsPrompt(domain, dnsDetails) {
  const failingChecks = Object.entries(dnsDetails)
    .filter(([, d]) => !d.success)
    .map(([key, value]) => {
      const info = dnsChecksInfo[key]
      if (key === 'subdomains' && value.issues?.length) {
        const subList = value.issues.map(i => `  - ${i.text}`).join('\n')
        return `- ${info.name}\n${subList}`
      }
      return `- ${info.name}: ${info.description}`
    })
    .join('\n')

  return `${domain} has these DNS issues (fixed in your DNS provider dashboard, not in code):

${failingChecks}

Give me the exact DNS records I need to add or fix for each one.`
}

export function generateCookiesPrompt(domain, cookieIssues) {
  const cookieList = cookieIssues.map(i =>
    `- "${i.cookie}": missing ${i.missingFlags.join(', ')}`
  ).join('\n')

  return `${domain} has cookies with missing security flags:

${cookieList}

Figure out which framework or library sets these cookies by reading my codebase, then show me how to add the missing flags. Note: HttpOnly and Secure are usually set at the server/framework level (e.g. session config, Set-Cookie headers), while SameSite may also be set there. If you can't tell, ask me.`
}

export function generateMixedContentPrompt(domain, issues) {
  const resourceList = issues.slice(0, 20).map(url => `- ${url}`).join('\n')
  const extra = issues.length > 20 ? `\n...and ${issues.length - 20} more.` : ''

  return `${domain} loads these resources over HTTP on an HTTPS page:

${resourceList}${extra}

These can come from three places — check all of them:
1. Hardcoded HTTP URLs in source code or templates
2. URLs stored in the database (e.g. user-generated content, CMS fields)
3. Third-party scripts or iframes that load additional HTTP sub-resources

Search my codebase for the URLs first. If they're not there, let me know so I can check the database or third-party integrations.`
}

export function generatePageAnalysisPrompt(domain, details) {
  const issues = []

  if (details.verboseErrors) {
    issues.push(`- Verbose errors: stack traces are visible on error pages`)
  }

  if (details.sriIssues?.length) {
    const urls = details.sriIssues.slice(0, 10).map(u => `  - ${u}`).join('\n')
    issues.push(`- Missing Subresource Integrity (SRI) on these CDN resources:\n${urls}\n  (To add SRI: fetch each resource, compute its SHA-384 hash, and add integrity + crossorigin attributes to the <script>/<link> tag. Use https://www.srihash.org or: curl -s <url> | openssl dgst -sha384 -binary | openssl base64 -A)`)
  }

  if (details.csrfIssues?.length) {
    const forms = details.csrfIssues.slice(0, 10).map(a => `  - ${a || '(no action)'}`).join('\n')
    issues.push(`- POST forms without a CSRF token field:\n${forms}`)
  }

  if (details.dirListingIssues?.length) {
    const paths = details.dirListingIssues.slice(0, 10).map(p => `  - ${p}`).join('\n')
    issues.push(`- Directory listing enabled at:\n${paths}`)
  }

  return `${domain} has these page security issues:

${issues.join('\n')}

Figure out which framework and server I'm using by reading my codebase, then show me how to fix each issue. If you can't tell, ask me.`
}

export function generateApiDocsPrompt(domain, exposedPaths) {
  const pathList = exposedPaths.map(p => `- ${domain}${p}`).join('\n')

  return `These API documentation endpoints are publicly accessible on ${domain}:

${pathList}

Figure out which framework serves these docs by reading my codebase, then show me how to disable them in production or restrict them to authenticated users only. If you can't tell, ask me.`
}
