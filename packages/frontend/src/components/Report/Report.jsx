import { Accordion, Badge, Blockquote, Box, Button, Card, Center, Flex, List, SimpleGrid, Table, Text, ThemeIcon, Title } from '@mantine/core'
import {
  SSLChart,
  HeaderChart,
  HeaderWarningsChart,
  FuzzChart,
  BrokenLinksChart,
  LoadingChart,
  CustomFlowsChart,
  DnsChart,
  CookiesChart,
  MixedContentChart,
  PageAnalysisChart,
  ApiDocsChart,
} from './ResultCharts'
import { getRecentChecks } from '@/utils/checks'
import recommendedHeaders from '@/utils/headers'
import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { STEP_TYPES } from '@/utils/customFlows';
import { IconCheck, IconX } from '@tabler/icons-react'
import { useAuthSWR } from '@/utils/useAuthSWR'
import { dnsChecksInfo } from '@statusscout/shared'

const LinksTable = ({ items, updateIgnoreList, loading, ignoreAction }) => {
  if (!items.length) {
    return <Text fs="italic" ta="center" my="xl">No broken links found</Text>
  }

  return <Table striped withTableBorder>
    <Table.Thead>
      <Table.Tr>
        <Table.Td>Status</Table.Td>
        <Table.Td>Broken Link</Table.Td>
        <Table.Td>Parent</Table.Td>
        {/* <Table.Td>{ignoreAction === 'add' ? 'Ignore' : 'Unignore'}</Table.Td> */}
      </Table.Tr>
    </Table.Thead>
    <Table.Tbody>
      {items.map((item, index) => <Table.Tr key={`links-${index}`}>
        <Table.Td w={70}><Badge color={item.status === 404 ? 'orange' : 'red'}>{item.status}</Badge></Table.Td>
        <Table.Td><a href={item.url} target="_blank" rel="noopener noreferrer">{item.url}</a></Table.Td>
        <Table.Td><a href={item.parent} target="_blank" rel="noopener noreferrer">{item.parent}</a></Table.Td>
        {/* <Table.Td align="center">
          <ActionIcon
            variant="outline"
            aria-label="Ignore Item"
            onClick={() => updateIgnoreList({ item, type: 'links', action: ignoreAction })}
            loading={loading === item.url}
            disabled={loading && loading !== item.url}
          >
            {ignoreAction === 'add'
              ? <IconBellOff style={{ width: '70%', height: '70%' }} stroke={1.5} />
              : <IconBell style={{ width: '70%', height: '70%' }} stroke={1.5} />}
          </ActionIcon>
        </Table.Td> */}
      </Table.Tr>)}
    </Table.Tbody>
  </Table>
}

function Report({ website, checks, status, isQuickCheck = false }) {
  const {
    fuzzCheck,
    headersCheck,
    sslCheck,
    linkCheck,
    customChecks,
    dnsCheck,
    cookieCheck,
    mixedContentCheck,
    pageAnalysisCheck,
    apiDocsCheck,
  } = getRecentChecks(checks)

  const { data: flows = [], isLoading: isLoadingFlows } = !isQuickCheck
    ? useAuthSWR(`${import.meta.env.VITE_API_URL}/v1/flows?websiteId=${website.index}`)
    : { data: [], isLoading: false };
  const [loading, setLoading] = useState(null)
  const { ignore = [] } = website // todo
  const updateIgnoreList = async ({ item, type, action }) => {
    setLoading(item.url)

    fetch(`${import.meta.env.VITE_API_URL}/v1/website/ignore`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ item: item.url, type, action }),
    }).then(async res => {
      mutate(`${import.meta.env.VITE_API_URL}/v1/website`)
    }).finally(() => {
      setLoading(null)
    })
  } // todo

  const customFlowLength = (status?.state === 'completed' || isLoadingFlows)
    ? customChecks.length
    : flows.length

  const brokenLinks = linkCheck && linkCheck.result.details // .filter(link => !ignore.filter(i => i.type === 'links').map(i => i.item).includes(link.url))

  const [showIgnored, setShowIgnored] = useState(false);
  const [expandHeaders, setExpandHeaders] = useState(false);
  const missingHeaders = headersCheck?.result?.details?.missingHeaders || [];
  const displayedHeaders = expandHeaders ? missingHeaders : missingHeaders.slice(0, 3);

  // Exposed files table expand state
  const [expandFiles, setExpandFiles] = useState(false);
  const exposedFiles = fuzzCheck?.result?.details?.files || [];
  const displayedFiles = expandFiles ? exposedFiles : exposedFiles.slice(0, 5);

  const sslRef = useRef(null);
  const headersRef = useRef(null);
  const headerWarningsRef = useRef(null);
  const fuzzRef = useRef(null);
  const linksRef = useRef(null);
  const customFlowsRef = useRef(null);
  const dnsRef = useRef(null);
  const cookiesRef = useRef(null);
  const mixedContentRef = useRef(null);
  const pageAnalysisRef = useRef(null);
  const apiDocsRef = useRef(null);

  const checkState = status?.state

  const hasDnsIssues = dnsCheck ? Object.values(dnsCheck.result.details).filter(d => !d.success).length !== 0 : false
  const hasMissingHeaders = missingHeaders.length !== 0
  const hasHeaderWarnings = headersCheck ? Boolean(
    headersCheck.result.details.versionDisclosure?.length ||
    (headersCheck.result.details.httpsRedirect &&
      !headersCheck.result.details.httpsRedirect.redirects &&
      !headersCheck.result.details.httpsRedirect.connectionFailed) ||
    headersCheck.result.details.corsWildcard
  ) : false
  const hasHeaderIssues = hasMissingHeaders || hasHeaderWarnings
  const hasCookieIssues = cookieCheck ? cookieCheck.result.details.issues.length !== 0 : false
  const hasMixedContent = mixedContentCheck ? mixedContentCheck.result.details.issues.length !== 0 : false
  const hasExposedApis = apiDocsCheck ? apiDocsCheck.result.details.exposed.length !== 0 : false
  const hasPageIssues = pageAnalysisCheck
    ? (pageAnalysisCheck.result.details.verboseErrors ||
       (pageAnalysisCheck.result.details.sriIssues?.length ?? 0) !== 0 ||
       (pageAnalysisCheck.result.details.csrfIssues?.length ?? 0) !== 0 ||
       (pageAnalysisCheck.result.details.dirListingIssues?.length ?? 0) !== 0)
    : false

  const scrollToRef = (ref) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div>
      <Card p="md" withBorder shadow="md">
        {status?.waitingIndex !== null && <Card.Section py="xl" px={{ base: "md", md: "xl" }} >
          <Blockquote p="md" my="md" maw={600} mx="auto">
            <Title order={2} size="h2" ta="center" mb="md">You're in the Queue</Title>

            <Text size="md" mb="md">Our system is handling a high volume of checks.<br />Hang tight — your website health check will begin shortly.</Text>
            <Text size="md">Current position in queue: <b>#{status?.waitingIndex + 1}</b></Text>
          </Blockquote>
        </Card.Section>}
        {status?.state === 'failed' && <Card.Section py="xl" px={{ base: "md", md: "xl" }} >
          <Blockquote p="md" my="md" maw={600} mx="auto" color="red">
            <Title order={2} size="h2" ta="center" mb="md">Check Failed</Title>

            <Text size="md" mb="md">Unfortunately, we encountered an error while processing your website health check.</Text>
            <Text size="md">Please try again later or contact support if the issue persists.</Text>
          </Blockquote>
        </Card.Section>}
        <Card.Section py="xl" px={{ base: "md", md: "xl" }}>
          <SimpleGrid cols={{ base: 2, xs: 3, lg: 5 }} spacing="xl" mb="md">
            <Flex direction="column" align="center" onClick={() => scrollToRef(sslRef)} style={{ cursor: 'pointer' }}>
              {sslCheck && <SSLChart status={sslCheck.result.status} />}
              {!sslCheck && <LoadingChart label="SSL Certificate" checkState={checkState} />}
            </Flex>

            <Flex direction="column" align="center" onClick={() => scrollToRef(fuzzRef)} style={{ cursor: 'pointer' }}>
              {fuzzCheck && <FuzzChart status={fuzzCheck.result.status} files={fuzzCheck.result.details.files} />}
              {!fuzzCheck && <LoadingChart label="Sensitive Files" checkState={checkState} />}
            </Flex>

            <Flex direction="column" align="center" onClick={() => scrollToRef(linksRef)} style={{ cursor: 'pointer' }}>
              {linkCheck && <BrokenLinksChart brokenLinks={brokenLinks} />}
              {!linkCheck && <LoadingChart label="Broken Links" checkState={checkState} />}
            </Flex>

            <Flex direction="column" align="center" onClick={() => scrollToRef(dnsRef)} style={{ cursor: 'pointer' }}>
              {dnsCheck && <DnsChart status={dnsCheck.result.status} details={dnsCheck.result.details} />}
              {!dnsCheck && <LoadingChart label="DNS Records" checkState={checkState} />}
            </Flex>

            <Flex direction="column" align="center" onClick={() => scrollToRef(headersRef)} style={{ cursor: 'pointer' }}>
              {headersCheck && <HeaderChart status={headersCheck.result.status} missingHeaders={headersCheck.result.details.missingHeaders} />}
              {!headersCheck && <LoadingChart label="Security Headers" checkState={checkState} />}
            </Flex>

            <Flex direction="column" align="center" onClick={() => scrollToRef(headerWarningsRef)} style={{ cursor: 'pointer' }}>
              {headersCheck && <HeaderWarningsChart details={headersCheck.result.details} />}
              {!headersCheck && <LoadingChart label="Header Warnings" checkState={checkState} />}
            </Flex>

            <Flex direction="column" align="center" onClick={() => scrollToRef(cookiesRef)} style={{ cursor: 'pointer' }}>
              {cookieCheck && <CookiesChart status={cookieCheck.result.status} issues={cookieCheck.result.details.issues} />}
              {!cookieCheck && <LoadingChart label="Cookie Security" checkState={checkState} />}
            </Flex>

            <Flex direction="column" align="center" onClick={() => scrollToRef(mixedContentRef)} style={{ cursor: 'pointer' }}>
              {mixedContentCheck && <MixedContentChart status={mixedContentCheck.result.status} issues={mixedContentCheck.result.details.issues} />}
              {!mixedContentCheck && <LoadingChart label="Mixed Content" checkState={checkState} />}
            </Flex>

            <Flex direction="column" align="center" onClick={() => scrollToRef(pageAnalysisRef)} style={{ cursor: 'pointer' }}>
              {pageAnalysisCheck && <PageAnalysisChart details={pageAnalysisCheck.result.details} />}
              {!pageAnalysisCheck && <LoadingChart label="Page Security" checkState={checkState} />}
            </Flex>

            <Flex direction="column" align="center" onClick={() => scrollToRef(apiDocsRef)} style={{ cursor: 'pointer' }}>
              {apiDocsCheck && <ApiDocsChart status={apiDocsCheck.result.status} exposed={apiDocsCheck.result.details.exposed} />}
              {!apiDocsCheck && <LoadingChart label="Exposed APIs" checkState={checkState} />}
            </Flex>

            {!isQuickCheck && <Flex direction="column" align="center" onClick={() => scrollToRef(customFlowsRef)} style={{ cursor: 'pointer' }}>
              {customChecks && <CustomFlowsChart checks={customChecks} customFlowLength={customFlowLength} />}
              {!customChecks && <LoadingChart label="Custom Flows" checkState={checkState} />}
            </Flex>}
          </SimpleGrid>
        </Card.Section>
        {isQuickCheck && <Card.Section py="xl" px={{ base: "md", md: "xl" }} withBorder>
          <Title order={2} size="h3" mb="lg" ta="center">
            Keep monitoring — don't just scan once
          </Title>
          <List size="md" mb="xl" spacing="sm" center mx="auto" style={{ maxWidth: 500 }}>
            <List.Item>
              Get alerted the moment new security issues appear
            </List.Item>
            <List.Item>
              Continuous checks every 5 minutes, 6 hours, and daily
            </List.Item>
            <List.Item>
              Simulate signups and checkouts with custom test flows
            </List.Item>
          </List>
          <Button component={Link} to="/register" variant="filled" size="sm" mx="auto" display="block" w={250}>
            Start Free 7-Day Trial
          </Button>
          <Text size="sm" c="dimmed" ta="center" mt="xs">
            *No credit card required. Cancel any time.
          </Text>
        </Card.Section>}
        <Card.Section withBorder py="xl" px={{ base: "md", md: "xl" }} ref={sslRef}>
          <Flex gap="xl" align="center" wrap="wrap">
            <Box style={{ flexShrink: 0 }}>
              {sslCheck
                ? <SSLChart status={sslCheck.result.status} size="lg" showLabel={false} />
                : <LoadingChart label="SSL Certificate" size="lg" checkState={checkState} showLabel={false} />}
            </Box>
            <Box style={{ flex: 1, minWidth: 220 }}>
              <Title order={3} mb="xs">SSL Certificate</Title>
              <Text size="sm" c="dimmed">An SSL certificate ensures encrypted data transmission, signals trust to users with the padlock symbol, and may enhance search engine rankings.</Text>
              {sslCheck?.result.status === 'success' && <Text size="sm" mt="xs" c="green">Valid until {new Date(sslCheck.result.details.validTo).toLocaleDateString()}</Text>}
              {sslCheck && sslCheck.result.status !== 'success' && <Text size="sm" mt="xs" c="red">Certificate issue detected.</Text>}
            </Box>
          </Flex>
        </Card.Section>

        <Card.Section withBorder py="xl" px={{ base: "md", md: "xl" }} ref={fuzzRef}>
          <Flex gap="xl" align="center" wrap="wrap" mb={fuzzCheck && exposedFiles.length > 0 ? 'xl' : 0}>
            <Box style={{ flexShrink: 0 }}>
              {fuzzCheck
                ? <FuzzChart status={fuzzCheck.result.status} files={fuzzCheck.result.details.files} size="lg" showLabel={false} />
                : <LoadingChart label="Sensitive Files" size="lg" checkState={checkState} showLabel={false} />}
            </Box>
            <Box style={{ flex: 1, minWidth: 220 }}>
              <Title order={3} mb="xs">Sensitive Files</Title>
              <Text size="sm" c="dimmed">Identifies publicly accessible files that may contain confidential information, helping to prevent data breaches and enhance website security.</Text>
              {fuzzCheck && exposedFiles.length === 0 && <Text size="sm" mt="xs" c="green">No exposed files found.</Text>}
              {isQuickCheck && <Text size="sm" mt="xs" c="dimmed" fs="italic">Quick check scan is limited to 165 most common files. Sign-up for a full scan.</Text>}
            </Box>
          </Flex>

          {fuzzCheck && exposedFiles.length > 0 && <>
            <Text size="md" mb="sm" mt="xl" fs="italic">The following exposed files were found. Please review them:</Text>

            <Table striped withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Td>URL</Table.Td>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {displayedFiles.map((item, index) => (
                  <Table.Tr key={`file-${index}`}>
                    <Table.Td>
                      <a href={`${website.domain}/${item.file}`} target="_blank" rel="noopener noreferrer">
                        {website.domain}/{item.file}
                      </a>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
            {exposedFiles.length > 5 && !expandFiles && (
              <Center mt="md">
                <Button onClick={() => setExpandFiles(true)}>
                  Show All
                </Button>
              </Center>
            )}
          </>}
        </Card.Section>

        <Card.Section withBorder py="xl" px={{ base: "md", md: "xl" }} ref={linksRef}>
          <Flex gap="xl" align="center" wrap="wrap" mb={linkCheck && linkCheck.result.details.length > 0 ? 'xl' : 0}>
            <Box style={{ flexShrink: 0 }}>
              {linkCheck
                ? <BrokenLinksChart brokenLinks={brokenLinks} size="lg" showLabel={false} />
                : <LoadingChart label="Broken Links" size="lg" checkState={checkState} showLabel={false} />}
            </Box>
            <Box style={{ flex: 1, minWidth: 220 }}>
              <Title order={3} mb="xs">Broken Links</Title>
              <Text size="sm" c="dimmed">Fixing broken links improves user experience, enhances SEO rankings, and maintains website credibility by ensuring all links lead to valid destinations.</Text>
              {linkCheck && linkCheck.result.details.filter(item => !ignore.map(i => i.item).includes(item.url)).length === 0 && <Text size="sm" mt="xs" c="green">No broken links were found.</Text>}
              {isQuickCheck && <Text size="sm" mt="xs" c="dimmed" fs="italic">Quick check scan only checks up to 200 links. Sign-up to check up to 4000 links.</Text>}
            </Box>
          </Flex>

          {linkCheck && linkCheck.result.details.length > 0 &&
            <List>
              <LinksTable
                items={linkCheck.result.details.filter(item => !ignore.map(i => i.item).includes(item.url))}
                updateIgnoreList={updateIgnoreList}
                loading={loading}
                ignoreAction="add"
              />

              {ignore.length > 0 &&
                <>
                  {!showIgnored && <Text mt="sm">
                    <a size="sm" mt="sm" variant="transparent" href="#show-ignored" onClick={e => { e.preventDefault(); setShowIgnored(true) }}>
                      Show {ignore.length} filtered {ignore.length === 1 ? 'item' : 'items'}
                    </a>
                  </Text>}
                  {showIgnored && <>
                    <Text mt="sm" mb="xs" fw="bold">Filtered Items</Text>
                    <LinksTable
                      items={ignore.map(i => linkCheck.result.details.find(item => item.url === i.item))}
                      updateIgnoreList={updateIgnoreList}
                      loading={loading}
                      ignoreAction="remove"
                    />
                  </>}
                </>
              }
            </List>
          }
        </Card.Section>

        <Card.Section withBorder py="xl" px={{ base: "md", md: "xl" }} ref={dnsRef}>
          <Flex gap="xl" align="center" wrap="wrap" mb={hasDnsIssues ? 'xl' : 0}>
            <Box style={{ flexShrink: 0 }}>
              {dnsCheck
                ? <DnsChart status={dnsCheck.result.status} details={dnsCheck.result.details} size="lg" showLabel={false} />
                : <LoadingChart label="DNS Records" size="lg" checkState={checkState} showLabel={false} />}
            </Box>
            <Box style={{ flex: 1, minWidth: 220 }}>
              <Title order={3} mb="xs">DNS Records</Title>
              <Text size="sm" c="dimmed">DNS checks ensure your domain's availability, email deliverability, and security. Missing or misconfigured records can lead to downtime, lost emails, or spoofing risks.</Text>
              {dnsCheck && !hasDnsIssues && <Text size="sm" mt="xs" c="green">No DNS issues found.</Text>}
            </Box>
          </Flex>

          {hasDnsIssues && <>
            <Text size="md" mb="sm" fs="italic">The following DNS issues have been identified:</Text>
            <Table striped withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Td>DNS Issue</Table.Td>
                  <Table.Td>Explanation</Table.Td>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {Object.entries(dnsCheck.result.details).filter(([key, d]) => !d.success && key !== 'subdomains').map(([key]) => (
                  <Table.Tr key={`dns-${key}`}>
                    <Table.Td><Text fw="bold">{dnsChecksInfo[key].name}</Text></Table.Td>
                    <Table.Td><Text>{dnsChecksInfo[key].description}</Text></Table.Td>
                  </Table.Tr>
                ))}
                {Object.entries(dnsCheck.result.details).filter(([key, d]) => !d.success && key === 'subdomains').map(([key, value]) => (
                  <Table.Tr key={`dns-${key}`}>
                    <Table.Td><Text fw="bold">{dnsChecksInfo[key].name}</Text></Table.Td>
                    <Table.Td>
                      <Text>{dnsChecksInfo[key].description} Following subdomains are affected:</Text>
                      <List mt="xs">
                        {value.issues.map((issue, index) => (
                          <List.Item key={`subdomain-issue-${index}`}><Text>{issue.text}</Text></List.Item>
                        ))}
                      </List>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </>}
        </Card.Section>

        <Card.Section withBorder py="xl" px={{ base: "md", md: "xl" }} ref={headersRef}>
          <Flex gap="xl" align="center" wrap="wrap" mb={hasMissingHeaders ? 'xl' : 0}>
            <Box style={{ flexShrink: 0 }}>
              {headersCheck
                ? <HeaderChart status={headersCheck.result.status} missingHeaders={headersCheck.result.details.missingHeaders} size="lg" showLabel={false} />
                : <LoadingChart label="Security Headers" size="lg" checkState={checkState} showLabel={false} />}
            </Box>
            <Box style={{ flex: 1, minWidth: 220 }}>
              <Title order={3} mb="xs">Security Headers</Title>
              <Text size="sm" c="dimmed">HTTP security headers help protect websites from common attacks, strengthen user trust, and can improve security compliance.</Text>
              {headersCheck && !hasMissingHeaders && <Text size="sm" mt="xs" c="green">All recommended security headers are present.</Text>}
            </Box>
          </Flex>

          {hasMissingHeaders && <>
            <Text size="md" mb="sm" fs="italic">The following recommended headers are missing:</Text>
            <Table striped withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Td>Header</Table.Td>
                  <Table.Td>Explanation</Table.Td>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {displayedHeaders.map((item, index) => (
                  <Table.Tr key={`header-${index}`}>
                    <Table.Td><Text fw="bold">{item}</Text></Table.Td>
                    <Table.Td><Text>{recommendedHeaders[item]}</Text></Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
            {missingHeaders.length > 3 && !expandHeaders && (
              <Center mt="md">
                <Button onClick={() => setExpandHeaders(true)}>Show All</Button>
              </Center>
            )}
          </>}
        </Card.Section>

        <Card.Section withBorder py="xl" px={{ base: "md", md: "xl" }} ref={headerWarningsRef}>
          <Flex gap="xl" align="center" wrap="wrap" mb={hasHeaderWarnings ? 'xl' : 0}>
            <Box style={{ flexShrink: 0 }}>
              {headersCheck
                ? <HeaderWarningsChart details={headersCheck.result.details} size="lg" showLabel={false} />
                : <LoadingChart label="Header Warnings" size="lg" checkState={checkState} showLabel={false} />}
            </Box>
            <Box style={{ flex: 1, minWidth: 220 }}>
              <Title order={3} mb="xs">Header Warnings</Title>
              <Text size="sm" c="dimmed">Misconfigured response headers can actively expose your server or allow cross-origin attacks, even when security headers are otherwise present.</Text>
              {headersCheck && !hasHeaderWarnings && <Text size="sm" mt="xs" c="green">No header configuration issues found.</Text>}
            </Box>
          </Flex>

          {headersCheck?.result?.details?.versionDisclosure?.length > 0 && (
            <Blockquote color="orange" p="md" my="md">
              <Text fw="bold" mb="xs">Technology version disclosure</Text>
              <Text size="sm" mb="sm">The following response headers reveal your server software or framework version, giving attackers a ready-made target list:</Text>
              <Table size="sm" mb="sm" withTableBorder>
                <Table.Tbody>
                  {headersCheck.result.details.versionDisclosure.map(v => (
                    <Table.Tr key={v.header}>
                      <Table.Td fw="bold">{v.header}</Table.Td>
                      <Table.Td><code>{v.value}</code></Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
              <Text size="sm">In Express, remove the header with <code>app.disable('x-powered-by')</code>. For nginx, set <code>server_tokens off</code> in your config.</Text>
            </Blockquote>
          )}

          {headersCheck?.result?.details?.httpsRedirect &&
            !headersCheck.result.details.httpsRedirect.redirects &&
            !headersCheck.result.details.httpsRedirect.connectionFailed && (
            <Blockquote color="orange" p="md" my="md">
              <Text fw="bold" mb="xs">HTTP not redirecting to HTTPS</Text>
              <Text size="sm">Your site is reachable over plain HTTP without being redirected to HTTPS. Users typing your domain without <code>https://</code> will connect insecurely. Add a permanent 301 redirect in your server or hosting config.</Text>
            </Blockquote>
          )}

          {headersCheck?.result?.details?.corsWildcard && (
            <Blockquote color="orange" p="md" my="md">
              <Text fw="bold" mb="xs">CORS wildcard detected (<code>Access-Control-Allow-Origin: *</code>)</Text>
              <Text size="sm">Your server allows any origin to read its responses. This is safe for fully public APIs, but dangerous if your endpoints handle authenticated data or cookies — it lets any website make requests to your API on behalf of your users.</Text>
            </Blockquote>
          )}
        </Card.Section>

        <Card.Section withBorder py="xl" px={{ base: "md", md: "xl" }} ref={cookiesRef}>
          <Flex gap="xl" align="center" wrap="wrap" mb={hasCookieIssues ? 'xl' : 0}>
            <Box style={{ flexShrink: 0 }}>
              {cookieCheck
                ? <CookiesChart status={cookieCheck.result.status} issues={cookieCheck.result.details.issues} size="lg" showLabel={false} />
                : <LoadingChart label="Cookie Security" size="lg" checkState={checkState} showLabel={false} />}
            </Box>
            <Box style={{ flex: 1, minWidth: 220 }}>
              <Title order={3} mb="xs">Cookie Security</Title>
              <Text size="sm" c="dimmed">Cookies without <code>HttpOnly</code>, <code>Secure</code>, and <code>SameSite</code> flags can be stolen by XSS attacks, sent over unencrypted connections, or abused in cross-site request forgery.</Text>
              {cookieCheck && cookieCheck.result.details.cookieCount === 0 && <Text size="sm" mt="xs" c="dimmed">No cookies were set on this page.</Text>}
              {cookieCheck && cookieCheck.result.details.cookieCount !== 0 && !hasCookieIssues && <Text size="sm" mt="xs" c="green">All cookies have the recommended security flags.</Text>}
            </Box>
          </Flex>

          {hasCookieIssues && <>
            <Text size="md" mb="sm" fs="italic">The following cookies are missing security flags:</Text>
            <Table striped withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Td>Cookie</Table.Td>
                  <Table.Td>Missing Flags</Table.Td>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {cookieCheck.result.details.issues.map((item, index) => (
                  <Table.Tr key={`cookie-${index}`}>
                    <Table.Td><Text fw="bold">{item.cookie}</Text></Table.Td>
                    <Table.Td><Text>{item.missingFlags.join(', ')}</Text></Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </>}
        </Card.Section>

        <Card.Section withBorder py="xl" px={{ base: "md", md: "xl" }} ref={mixedContentRef}>
          <Flex gap="xl" align="center" wrap="wrap" mb={hasMixedContent ? 'xl' : 0}>
            <Box style={{ flexShrink: 0 }}>
              {mixedContentCheck
                ? <MixedContentChart status={mixedContentCheck.result.status} issues={mixedContentCheck.result.details.issues} size="lg" showLabel={false} />
                : <LoadingChart label="Mixed Content" size="lg" checkState={checkState} showLabel={false} />}
            </Box>
            <Box style={{ flex: 1, minWidth: 220 }}>
              <Title order={3} mb="xs">Mixed Content</Title>
              <Text size="sm" c="dimmed">Mixed content occurs when an HTTPS page loads resources (images, scripts, fonts) over plain HTTP. Browsers block or warn on these requests, and attackers can intercept and modify the insecure resources.</Text>
              {mixedContentCheck?.result?.details?.skipped && <Text size="sm" mt="xs" c="dimmed">Not applicable — site is not served over HTTPS.</Text>}
              {mixedContentCheck && !mixedContentCheck.result.details.skipped && !hasMixedContent && <Text size="sm" mt="xs" c="green">No mixed content found.</Text>}
            </Box>
          </Flex>

          {hasMixedContent && <>
            <Text size="md" mb="sm" fs="italic">The following HTTP resources were found on this HTTPS page:</Text>
            <Table striped withTableBorder>
              <Table.Thead>
                <Table.Tr><Table.Td>Resource URL</Table.Td></Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {mixedContentCheck.result.details.issues.map((url, index) => (
                  <Table.Tr key={`mixed-${index}`}>
                    <Table.Td><Text>{url}</Text></Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </>}
        </Card.Section>

        <Card.Section withBorder py="xl" px={{ base: "md", md: "xl" }} ref={pageAnalysisRef}>
          <Flex gap="xl" align="center" wrap="wrap" mb={hasPageIssues ? 'xl' : 0}>
            <Box style={{ flexShrink: 0 }}>
              {pageAnalysisCheck
                ? <PageAnalysisChart details={pageAnalysisCheck.result.details} size="lg" showLabel={false} />
                : <LoadingChart label="Page Security" size="lg" checkState={checkState} showLabel={false} />}
            </Box>
            <Box style={{ flex: 1, minWidth: 220 }}>
              <Title order={3} mb="xs">Page Security</Title>
              <Text size="sm" c="dimmed">Analyses the page HTML for common issues AI-generated apps leave behind: verbose error pages, CDN resources without Subresource Integrity, POST forms without CSRF protection, and server-side directory listings.</Text>
              {pageAnalysisCheck && !hasPageIssues && <Text size="sm" mt="xs" c="green">No page security issues found.</Text>}
            </Box>
          </Flex>

          {pageAnalysisCheck && <>
            {pageAnalysisCheck.result.details.verboseErrors && (
              <Blockquote color="red" p="md" my="md">
                <Text fw="bold" mb="xs">Verbose error page detected</Text>
                <Text size="sm">A non-existent URL returned a response containing Node.js stack trace patterns. This leaks file paths, module names, and framework internals to anyone who triggers an error.</Text>
              </Blockquote>
            )}

            {pageAnalysisCheck.result.details.sriIssues?.length > 0 && <>
              <Text size="md" mt="xl" mb="sm" fs="italic">External resources loaded without Subresource Integrity:</Text>
              <Table striped withTableBorder>
                <Table.Thead><Table.Tr><Table.Td>Resource URL</Table.Td></Table.Tr></Table.Thead>
                <Table.Tbody>
                  {pageAnalysisCheck.result.details.sriIssues.map((url, i) => (
                    <Table.Tr key={`sri-${i}`}><Table.Td><Text size="sm">{url}</Text></Table.Td></Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
              <Text size="sm" c="dimmed" mt="xs">Add an <code>integrity</code> attribute to each tag. Use <a href="https://www.srihash.org/" target="_blank" rel="noopener noreferrer">srihash.org</a> to generate hashes.</Text>
            </>}

            {pageAnalysisCheck.result.details.csrfIssues?.length > 0&& <>
              <Text size="md" mt="xl" mb="sm" fs="italic">POST forms without a CSRF token field:</Text>
              <Table striped withTableBorder>
                <Table.Thead><Table.Tr><Table.Td>Form action</Table.Td></Table.Tr></Table.Thead>
                <Table.Tbody>
                  {pageAnalysisCheck.result.details.csrfIssues.map((action, i) => (
                    <Table.Tr key={`csrf-${i}`}><Table.Td><Text size="sm">{action}</Text></Table.Td></Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
              <Text size="sm" c="dimmed" mt="xs">Note: SPA frameworks often use CSRF tokens in headers rather than form fields — verify manually if your app uses Ajax for form submission.</Text>
            </>}

            {pageAnalysisCheck.result.details.dirListingIssues?.length > 0 && <>
              <Text size="md" mt="xl" mb="sm" fs="italic">Directory listing enabled at:</Text>
              <Table striped withTableBorder>
                <Table.Thead><Table.Tr><Table.Td>Path</Table.Td></Table.Tr></Table.Thead>
                <Table.Tbody>
                  {pageAnalysisCheck.result.details.dirListingIssues.map((path, i) => (
                    <Table.Tr key={`dir-${i}`}><Table.Td><Text size="sm">{path}</Text></Table.Td></Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </>}
          </>}
        </Card.Section>

        <Card.Section withBorder py="xl" px={{ base: "md", md: "xl" }} ref={apiDocsRef}>
          <Flex gap="xl" align="center" wrap="wrap" mb={hasExposedApis ? 'xl' : 0}>
            <Box style={{ flexShrink: 0 }}>
              {apiDocsCheck
                ? <ApiDocsChart status={apiDocsCheck.result.status} exposed={apiDocsCheck.result.details.exposed} size="lg" showLabel={false} />
                : <LoadingChart label="Exposed APIs" size="lg" checkState={checkState} showLabel={false} />}
            </Box>
            <Box style={{ flex: 1, minWidth: 220 }}>
              <Title order={3} mb="xs">Exposed APIs</Title>
              <Text size="sm" c="dimmed">Checks for publicly accessible API documentation (Swagger, OpenAPI, GraphQL) that should require authentication. Frameworks like FastAPI and tools like Swagger UI expose full API specs by default — a roadmap for attackers.</Text>
              {apiDocsCheck && !hasExposedApis && <Text size="sm" mt="xs" c="green">No exposed API documentation found.</Text>}
            </Box>
          </Flex>

          {hasExposedApis && <>
            <Text size="md" mb="sm" fs="italic">The following API documentation endpoints are publicly accessible:</Text>
            <Table striped withTableBorder>
              <Table.Thead><Table.Tr><Table.Td>Path</Table.Td></Table.Tr></Table.Thead>
              <Table.Tbody>
                {apiDocsCheck.result.details.exposed.map((path, i) => (
                  <Table.Tr key={`apidoc-${i}`}><Table.Td><Text size="sm">{path}</Text></Table.Td></Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
            <Text size="sm" c="dimmed" mt="xs">Restrict these paths to authenticated users or disable them entirely in production. In FastAPI, set <code>docs_url=None</code> and <code>redoc_url=None</code>.</Text>
          </>}
        </Card.Section>

        {!isQuickCheck &&
          <Card.Section withBorder py="xl" px={{ base: "md", md: "xl" }} ref={customFlowsRef}>
            <Flex gap="xl" align="center" wrap="wrap" mb={customFlowLength !== 0 ? 'xl' : 0}>
              <Box style={{ flexShrink: 0 }}>
                {customChecks
                  ? <CustomFlowsChart checks={customChecks} customFlowLength={customFlowLength} size="lg" showLabel={false} />
                  : <LoadingChart label="Custom Flows" size="lg" checkState={checkState} showLabel={false} />}
              </Box>
              <Box style={{ flex: 1, minWidth: 220 }}>
                <Title order={3} mb="xs">Custom Flows</Title>
                <Text size="sm" c="dimmed">Custom test flows allow you to define a series of actions and assertions to be executed on your website.</Text>
                {customFlowLength === 0 && <Text size="sm" mt="xs" c="dimmed">No custom flows have been defined yet.</Text>}
              </Box>
            </Flex>

            {customFlowLength === 0 && (
              <Center>
                <Button component={Link} to={`/website/${website.index}/custom-flows`} mt="md">
                  Create Custom Test Flow
                </Button>
              </Center>
            )}

            {customChecks?.length !== 0 && <>
              {customChecks.map((check, index) => (
                <Accordion key={`custom-${index}`} my="md" variant="contained">
                  <Accordion.Item value={`custom-${index}`}>
                    <Accordion.Control>
                      <Flex gap="sm" align="center">
                        {check.result.status === 'success' ? <Badge color="green">Success</Badge> : <Badge color="red">Fail</Badge>}
                        <Text>{check?.result?.name}</Text>
                      </Flex>
                    </Accordion.Control>
                    <Accordion.Panel>
                      <List pl="xs">
                        {check.result.details.steps.map((stepResult, idx) => {
                          const stepDetails = STEP_TYPES.find(s => s.value === stepResult.type)
                          return (
                            <List.Item
                              key={`flow-${stepResult.flowId}-step-${idx}`}
                              icon={<ThemeIcon color={stepResult.error ? 'red' : 'green'} size="xs" radius="sm" mt="4px">
                                {stepResult.error ? <IconX /> : <IconCheck />}
                              </ThemeIcon>}
                              styles={{ itemWrapper: { alignItems: 'flex-start' } }}
                            >
                              <Text>
                                {stepDetails.label}: {stepDetails.getDescription ? stepDetails.getDescription(stepResult) : ''}
                              </Text>
                              {stepResult.error && (
                                <List>
                                  <List.Item c="red">Error: {stepResult.error}</List.Item>
                                </List>
                              )}
                            </List.Item>
                          )
                        })}
                      </List>
                    </Accordion.Panel>
                  </Accordion.Item>
                </Accordion>
              ))}
            </>}
          </Card.Section>
        }
      </Card>
    </div >
  )
}

export default Report
