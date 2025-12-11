import { Accordion, Badge, Blockquote, Button, Card, Center, Flex, List, Loader, Overlay, SimpleGrid, Table, Text, ThemeIcon, Title } from '@mantine/core'
import {
  SSLChart,
  HeaderChart,
  FuzzChart,
  PerformanceChart,
  SEOChart,
  BrokenLinksChart,
  AccessibilityChart,
  LoadingChart,
  CustomFlowsChart,
  DnsChart,
} from './ResultCharts'
import { getRecentChecks } from '@/utils/checks'
import recommendedHeaders from '@/utils/headers'
import { useRef, useState } from 'react'
import PerformanceBar from '@/components/Dashboard/PerformanceBar';
import Markdown from 'react-markdown'
import { Link } from 'react-router-dom'
import { STEP_TYPES } from '@/utils/customFlows';
import { IconCheck, IconX } from '@tabler/icons-react'
import { useAuthSWR } from '@/utils/useAuthSWR'
import { dnsChecksInfo } from '@statusscout/shared'

const MarkdownElem = ({ children }) => {
  return <Markdown components={{
    a: ({ href, children, ...props }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      >
        {children}
      </a>
    ),
    p: ({ children }) => <Text size="sm" style={{ margin: '0' }}>{children}</Text>,
  }}>{children}</Markdown>
}

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
    performanceCheck,
    fuzzCheck,
    headersCheck,
    sslCheck,
    a11yCheck,
    seoCheck,
    linkCheck,
    customChecks,
    dnsCheck,
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

  const performances = [
    performanceCheck?.result?.details?.desktopResult?.LCP?.category,
    performanceCheck?.result?.details?.desktopResult?.INP?.category,
    performanceCheck?.result?.details?.desktopResult?.CLS?.category,
    performanceCheck?.result?.details?.mobileResult?.LCP?.category,
    performanceCheck?.result?.details?.mobileResult?.INP?.category,
    performanceCheck?.result?.details?.mobileResult?.CLS?.category,
  ].filter(Boolean)

  const brokenLinks = linkCheck && linkCheck.result.details // .filter(link => !ignore.filter(i => i.type === 'links').map(i => i.item).includes(link.url))

  const [expandHeaders, setExpandHeaders] = useState(false);
  const missingHeaders = headersCheck?.result?.details?.missingHeaders || [];
  const displayedHeaders = expandHeaders ? missingHeaders : missingHeaders.slice(0, 3);

  // Exposed files table expand state
  const [expandFiles, setExpandFiles] = useState(false);
  const exposedFiles = fuzzCheck?.result?.details?.files || [];
  const displayedFiles = expandFiles ? exposedFiles : exposedFiles.slice(0, 5);

  const sslRef = useRef(null);
  const headersRef = useRef(null);
  const fuzzRef = useRef(null);
  const performanceRef = useRef(null);
  const seoRef = useRef(null);
  const a11yRef = useRef(null);
  const linksRef = useRef(null);
  const customFlowsRef = useRef(null);
  const dnsRef = useRef(null);

  const checkState = status?.state

  const scrollToRef = (ref) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div>
      <Card p="md" withBorder shadow="md">
        {status?.waitingIndex !== null && <Card.Section py="xl" px={{ base: "md", md: "xl" }} >
          <Blockquote p="md" my="md" maw={600} mx="auto">
            <Title order={2} size="h2" ta="center" mb="md">You’re in the Queue</Title>

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
            <Flex direction="column" align="center" onClick={() => scrollToRef(performanceRef)} style={{ cursor: 'pointer' }}>
              {performanceCheck && <PerformanceChart performances={performances} />}
              {!performanceCheck && <LoadingChart label="Performance" checkState={checkState} />}
            </Flex>

            <Flex direction="column" align="center" onClick={() => scrollToRef(seoRef)} style={{ cursor: 'pointer' }}>
              {seoCheck && <SEOChart score={seoCheck.result.details.score.toFixed(0)} />}
              {!seoCheck && <LoadingChart label="SEO Score" checkState={checkState} />}
            </Flex>

            <Flex direction="column" align="center" onClick={() => scrollToRef(a11yRef)} style={{ cursor: 'pointer' }}>
              {a11yCheck && <AccessibilityChart score={a11yCheck.result.details.score.toFixed(0)} />}
              {!a11yCheck && <LoadingChart label="Accessibility" checkState={checkState} />}
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
              {!headersCheck && <LoadingChart label="HTTP Headers" checkState={checkState} />}
            </Flex>

            {!isQuickCheck && <Flex direction="column" align="center" onClick={() => scrollToRef(customFlowsRef)} style={{ cursor: 'pointer' }}>
              {customChecks && <CustomFlowsChart checks={customChecks} customFlowLength={customFlowLength} />}
              {!customChecks && <LoadingChart label="Custom Flows" checkState={checkState} />}
            </Flex>}
          </SimpleGrid>
        </Card.Section>
        {isQuickCheck && <Card.Section py="xl" px={{ base: "md", md: "xl" }} withBorder>
          <Title order={2} size="h3" mb="lg" ta="center">
            Sign up for monitoring and more
          </Title>
          <List size="md" mb="xl" spacing="sm" center mx="auto" style={{ maxWidth: 500 }}>
            <List.Item>
              Get notifications if new issues are detected
            </List.Item>
            <List.Item>
              Create custom test flows
            </List.Item>
            <List.Item>
              And much more...
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
          {sslCheck && <>
            <SSLChart status={sslCheck.result.status} size="lg" />
            {sslCheck.result.status === 'success' && <Text size="md" ta="center" fs="italic">Valid until {new Date(sslCheck.result.details.validTo).toLocaleDateString()}</Text>}
          </>}
          {!sslCheck && <LoadingChart label="SSL Certificate" size="lg" checkState={checkState} />}

          <Blockquote p="md" my="md" maw={600} mx="auto">An SSL certificate ensures encrypted data transmission, signals trust to users with the padlock symbol, and may enhance search engine rankings.</Blockquote>

        </Card.Section>

        <Card.Section withBorder py="xl" px={{ base: "md", md: "xl" }} ref={fuzzRef}>
          {fuzzCheck && <>
            <FuzzChart status={fuzzCheck.result.status} files={fuzzCheck.result.details.files} size="lg" />
            {exposedFiles.length === 0 && <Text size="md" ta="center" fs="italic">
              No exposed files found.
            </Text>}
            {isQuickCheck && <Text size="md" ta="center" fs="italic" mt="sm">
              The quick check scan is limited to 165 most common files. Sign-up for a full scan.
            </Text>}
          </>}
          {!fuzzCheck && <LoadingChart label="Sensitive Files" size="lg" checkState={checkState} />}
          <Blockquote p="md" my="md" maw={600} mx="auto">The sensitive files check identifies publicly accessible files that may contain confidential information, helping to prevent data breaches and enhance website security.</Blockquote>

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

        <Card.Section withBorder py="xl" px={{ base: "md", md: "xl" }} ref={performanceRef}>
          {performanceCheck && <PerformanceChart performances={performances} size="lg" />}
          {!performanceCheck && <LoadingChart label="Performance" size="lg" checkState={checkState} />}

          <Blockquote p="md" my="md" maw={600} mx="auto">Good Core Web Vitals enhance user experience, improve search rankings, and boost engagement by ensuring fast, responsive, and stable web pages.</Blockquote>

          <Title order={2} size="h4" mb="xs" mt="xl">Desktop Results</Title>
          <PerformanceBar title="Largest Contentful Paint" isLoading={!performanceCheck} metric={performanceCheck?.result?.details?.desktopResult?.LCP} mb="sm" />
          <PerformanceBar title="Interaction to Next Paint" isLoading={!performanceCheck} metric={performanceCheck?.result?.details?.desktopResult?.INP} mb="sm" />
          <PerformanceBar title="Cumulative Layout Shift" isLoading={!performanceCheck} metric={performanceCheck?.result?.details?.desktopResult?.CLS} />

          <Title order={2} size="h4" mb="xs" mt="xl">Mobile Results</Title>
          <PerformanceBar title="Largest Contentful Paint" isLoading={!performanceCheck} metric={performanceCheck?.result?.details?.mobileResult?.LCP} mb="sm" />
          <PerformanceBar title="Interaction to Next Paint" isLoading={!performanceCheck} metric={performanceCheck?.result?.details?.mobileResult?.INP} mb="sm" />
          <PerformanceBar title="Cumulative Layout Shift" isLoading={!performanceCheck} metric={performanceCheck?.result?.details?.mobileResult?.CLS} />
        </Card.Section>

        <Card.Section withBorder py="xl" px={{ base: "md", md: "xl" }} ref={seoRef}>
          {seoCheck && <>
            <SEOChart score={seoCheck.result.details.score} size="lg" />
            {seoCheck.result.details.items.length === 0 && <Text size="md" ta="center" fs="italic">No SEO issues were found.</Text>}
          </>}
          {!seoCheck && <LoadingChart label="SEO Score" size="lg" checkState={checkState} />}

          <Blockquote p="md" my="md" maw={600} mx="auto">A good SEO score improves search engine rankings, increases organic traffic, and enhances online visibility, leading to greater reach and potential customer engagement.</Blockquote>

          {seoCheck && seoCheck.result.details.items.length > 0 &&
            <>
              <Text size="md" mb="sm" mt="xl" fs="italic">The following SEO issues were found:</Text>
              <Accordion variant="contained">
                {seoCheck.result.details.items.map((item, index1) => (
                  <Accordion.Item key={`a11y-${index1}`} value={item.title}>
                    <Accordion.Control>{item.title}</Accordion.Control>
                    <Accordion.Panel>
                      <Blockquote p="xs" mb="sm" color="gray"><MarkdownElem>{item.description}</MarkdownElem></Blockquote>
                      <Table striped withTableBorder>
                        <Table.Tbody>
                          {item.items.map((item, index2) => <Table.Tr key={`a11y-${index1}-${index2}`}>
                            <Table.Td w={40}>{index2 + 1}</Table.Td>
                            <Table.Td>{item}</Table.Td>
                          </Table.Tr>)}
                        </Table.Tbody>
                      </Table>
                    </Accordion.Panel>
                  </Accordion.Item>
                ))}
              </Accordion>
            </>
          }
        </Card.Section>

        <Card.Section withBorder py="xl" px={{ base: "md", md: "xl" }} ref={a11yRef}>
          {a11yCheck && <>
            <AccessibilityChart score={a11yCheck.result.details.score} size="lg" />
            {a11yCheck.result.details.items.length === 0 && <Text size="md" ta="center" fs="italic">No accessibility issues were found.</Text>}
          </>}
          {!a11yCheck && <LoadingChart label="Accessibility" size="lg" checkState={checkState} />}

          <Blockquote p="md" my="md" maw={600} mx="auto">A high accessibility score ensures inclusivity, enhances user experience for all visitors, and helps meet legal compliance standards, broadening your audience reach.</Blockquote>

          {a11yCheck && a11yCheck.result.details.items.length > 0 &&
            <>
              <Text size="md" mb="sm" mt="xl" fs="italic">The following accessibility issues were found:</Text>
              <Accordion variant="contained">
                {a11yCheck.result.details.items.map((item, index1) => (
                  <Accordion.Item key={`a11y-${index1}`} value={item.title}>
                    <Accordion.Control>{item.title}</Accordion.Control>
                    <Accordion.Panel>
                      <Blockquote p="xs" mb="sm" color="gray"><MarkdownElem>{item.description}</MarkdownElem></Blockquote>
                      <Table striped withTableBorder>
                        <Table.Tbody>
                          {item.items.map((item, index2) => <Table.Tr key={`a11y-${index1}-${index2}`}>
                            <Table.Td w={40}>{index2 + 1}</Table.Td>
                            <Table.Td>{item}</Table.Td>
                          </Table.Tr>)}
                        </Table.Tbody>
                      </Table>
                    </Accordion.Panel>
                  </Accordion.Item>
                ))}
              </Accordion>
            </>}
        </Card.Section>

        <Card.Section withBorder py="xl" px={{ base: "md", md: "xl" }} ref={linksRef}>
          {linkCheck && <>
            <BrokenLinksChart brokenLinks={brokenLinks} size="lg" />
            {linkCheck.result.details.filter(item => !ignore.map(i => i.item).includes(item.url)).length === 0 && <Text size="md" ta="center" fs="italic">No broken links were found.</Text>}
          </>}
          {!linkCheck && <LoadingChart label="Broken Links" size="lg" checkState={checkState} />}
          {isQuickCheck && <Text size="md" ta="center" fs="italic" mt="sm">
            The quick check scan only checks up to 200 links. Sign-up to check up to 4000 links.
          </Text>}
          <Blockquote p="md" my="md" maw={600} mx="auto">Fixing broken links improves user experience, enhances SEO rankings, and maintains website credibility by ensuring all links lead to valid destinations.</Blockquote>

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
          {dnsCheck && <>
            <DnsChart status={dnsCheck.result.status} details={dnsCheck.result.details} size="lg" />
            {Object.values(dnsCheck.result.details).filter(d => !d.success).length === 0 && <Text size="md" ta="center" fs="italic">No DNS issues found.</Text>}
          </>}
          {!dnsCheck && <LoadingChart label="DNS Records" size="lg" checkState={checkState} />}

          <Blockquote p="md" my="md" maw={600} mx="auto">DNS checks ensure your domain’s availability, email deliverability, and security. Missing or misconfigured records can lead to downtime, lost emails, or spoofing risks. Regular audits help maintain a stable and trusted domain.</Blockquote>

          {dnsCheck && Object.values(dnsCheck.result.details).filter(d => !d.success).length > 0 && <>
            <Text size="md" mb="sm" mt="xl" fs="italic">The following DNS Issues have been identified:</Text>

            <Table striped withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Td>DNS Issue</Table.Td>
                  <Table.Td>Explanation</Table.Td>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {dnsCheck && Object.entries(dnsCheck.result.details).filter(([key, d]) => !d.success && key !== 'subdomains').map(([key, value]) => (
                  <Table.Tr key={`header-${key}`}>
                    <Table.Td><Text fw="bold">{dnsChecksInfo[key].name}</Text></Table.Td>
                    <Table.Td><Text>{dnsChecksInfo[key].description}</Text></Table.Td>
                  </Table.Tr>
                ))}
                {dnsCheck && Object.entries(dnsCheck.result.details).filter(([key, d]) => !d.success && key === 'subdomains').map(([key, value]) => (
                  <Table.Tr key={`header-${key}`}>
                    <Table.Td><Text fw="bold">{dnsChecksInfo[key].name}</Text></Table.Td>
                    <Table.Td>
                      <Text>{dnsChecksInfo[key].description} Following subdomains are affected:</Text>
                      <List mt="xs">
                        {value.issues.map((issue, index) => (
                          <List.Item key={`subdomain-issue-${index}`}>
                            <Text>{issue.text}</Text>
                          </List.Item>
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
          {headersCheck && <>
            <HeaderChart status={headersCheck.result.status} missingHeaders={headersCheck.result.details.missingHeaders} size="lg" />
            {headersCheck.result.details.missingHeaders.length === 0 && <Text size="md" ta="center" fs="italic">All important security headers are present.</Text>}
          </>}
          {!headersCheck && <LoadingChart label="HTTP Headers" size="lg" checkState={checkState} />}

          <Blockquote p="md" my="md" maw={600} mx="auto">HTTP security headers help protect websites from common attacks, strengthen user trust, and can improve security compliance.</Blockquote>

          {headersCheck && headersCheck.result.details.missingHeaders.length > 0 && <>
            <Text size="md" mb="sm" mt="xl" fs="italic">The following recommended headers are missing:</Text>

            <>
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
                  <Button onClick={() => setExpandHeaders(true)}>
                    Show All
                  </Button>
                </Center>
              )}
            </>
          </>}
        </Card.Section>

        {!isQuickCheck &&
          <Card.Section withBorder py="xl" px={{ base: "md", md: "xl" }} ref={customFlowsRef}>
            {customChecks && <>
              <CustomFlowsChart checks={customChecks} customFlowLength={customFlowLength} size="lg" />
            </>}
            {!customChecks && <LoadingChart label="Custom Flows" size="lg" checkState={checkState} />}
            <Blockquote p="md" my="md" maw={600} mx="auto">Custom test flows allow you to define a series of actions and assertions to be executed on your website.</Blockquote>

            {customFlowLength === 0 && <>
              <Text size="md" ta="center" fs="italic">No custom flows have been defined for this Report.</Text>
              <Button component={Link} to={`/website/${website.index}/custom-flows`} mt="md" mx="auto" display="block" w={300}>
                Create Custom Test Flow
              </Button>
            </>}

            {customChecks.length > 0 && <>
              {customChecks.map((check, index) => (
                <Accordion key={`custom-${index}`} my="md" variant="contained">
                  <Accordion.Item value={`custom-${index}`}>
                    <Accordion.Control>
                      <Flex gap="sm" align="center">
                        {check.result.status === 'success' ? <Badge color="green">Success</Badge> : <Badge color="red">Fail</Badge>} <Text>{check?.result?.name}</Text>
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
                                  <List.Item c="red">
                                    Error: {stepResult.error}
                                  </List.Item>
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
