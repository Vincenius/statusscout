import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Anchor, Box, Button, Container, Group, Loader, Center, Text, Title } from '@mantine/core'
import { Helmet } from 'react-helmet-async'
import Report from '@/components/Report/Report'
import { computeSecurityScore } from '@statusscout/shared'
import { getRecentChecks } from '@/utils/checks'

function PublicReport() {
  const { domain } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/v1/public-report/${domain}`)
      .then(res => {
        if (!res.ok) throw new Error('Not found')
        return res.json()
      })
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [domain])

  const { hostname, score, grade } = useMemo(() => {
    if (!data) return {}
    let hostname
    try { hostname = new URL(data.domain).hostname } catch { hostname = domain }

    const { fuzzCheck, headersCheck, sslCheck, dnsCheck, cookieCheck, mixedContentCheck, pageAnalysisCheck, apiDocsCheck } = getRecentChecks(data.checks || [])
    const exposedFiles = fuzzCheck?.result?.details?.files || []
    const missingHeaders = headersCheck?.result?.details?.missingHeaders || []
    const result = computeSecurityScore({ sslCheck, fuzzCheck, headersCheck, dnsCheck, cookieCheck, mixedContentCheck, pageAnalysisCheck, apiDocsCheck, exposedFiles, missingHeaders })

    return { hostname, score: result.score, grade: result.grade }
  }, [data, domain])

  if (loading) {
    return (
      <Center h="100vh">
        <Loader />
      </Center>
    )
  }

  if (error) {
    return (
      <Container size="sm" py="xl">
        <Title order={2} mb="md">Report not found</Title>
        <Text c="dimmed">This report is not public or does not exist.</Text>
        <Button component="a" href={import.meta.env.VITE_APP_URL || '/'} mt="lg">
          Go to StatusScout
        </Button>
      </Container>
    )
  }

  const issueCount = data.checks?.length || 0
  const metaDescription = `${hostname} scored ${score}/100 (Grade ${grade}) on the StatusScout security scan. View the full security report.`

  return (
    <>
      <Helmet>
        <title>{hostname} Security Report — StatusScout</title>
        <meta name="description" content={metaDescription} />
      </Helmet>

      <Box
        py="sm"
        px="md"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'var(--mantine-color-dark-8, #1a1b1e)',
          borderBottom: '1px solid var(--mantine-color-dark-5, #373a40)',
        }}
      >
        <Container size="md">
          <Group justify="space-between" wrap="nowrap">
            <Text c="white" size="sm" fw={500} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {hostname} — Security Grade: <strong>{grade}</strong>
            </Text>
            <Button
              component="a"
              href={import.meta.env.VITE_APP_URL || '/'}
              size="xs"
              variant="white"
              style={{ flexShrink: 0 }}
            >
              Scan your site free →
            </Button>
          </Group>
        </Container>
      </Box>

      <Container size="md" py="md" px={{ base: '0', md: 'md' }}>
        <Report
          website={{ domain: data.domain, publicReport: true }}
          checks={data.checks || []}
          status={{ state: 'completed' }}
          isPublicReport={true}
        />
        <Text size="xs" c="dimmed" ta="center" mt="xl">
          Powered by <Anchor href={import.meta.env.VITE_APP_URL || '/'}>StatusScout</Anchor> — automated website security monitoring
        </Text>
      </Container>
    </>
  )
}

export default PublicReport
