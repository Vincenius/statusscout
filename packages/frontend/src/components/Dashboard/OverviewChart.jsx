import { RadarChart } from "@mantine/charts"
import calcScore from '@/utils/calcScore'

const byDate = (d1, d2) => new Date(d2.createdAt) - new Date(d1.createdAt)

const OverviewChart = ({ data = [], flows = [] }) => {
  const uptimes = data.filter(d => d.check === 'uptime')
  const recentFuzz = data.filter(d => d.check === 'fuzz').sort(byDate)[0]
  const recentHeaders = data.filter(d => d.check === 'headers').sort(byDate)[0]
  const recentSSL = data.filter(d => d.check === 'ssl').sort(byDate)[0]
  const recentDns = data.filter(d => d.check === 'dns').sort(byDate)[0]
  const recentPageAnalysis = data.filter(d => d.check === 'pageanalysis').sort(byDate)[0]
  const recentLinks = data.filter(d => d.check === 'links').sort(byDate)[0]
  const recentCustomChecks = data.filter(d => d.check === 'custom').sort(byDate)[0]

  const fuzzScore = calcScore(recentFuzz?.result?.details?.files?.length ?? 0, 20)
  const headersScore = calcScore(recentHeaders?.result?.details?.missingHeaders?.length ?? 0, 10)
  const sslPenalty = recentSSL?.result?.status === 'success' ? 0 : 100
  const securityScore = Math.max(Math.round(fuzzScore * 0.8 + headersScore * 0.2) - (sslPenalty / 2), 0)

  const failedDns = recentDns
    ? Object.values(recentDns.result?.details || {}).filter(d => !d.success).length
    : 0
  const dnsScore = calcScore(failedDns, 11)

  const pad = recentPageAnalysis?.result?.details || {}
  const pageSecurityIssues =
    (pad.verboseErrors ? 1 : 0) +
    (pad.sriIssues?.length || 0) +
    (pad.csrfIssues?.length || 0) +
    (pad.dirListingIssues?.length || 0)
  const pageSecurityScore = calcScore(pageSecurityIssues, 10)

  const linkScore = recentLinks ? calcScore(recentLinks.result?.details?.length ?? 0, 20) : null

  const customScore = (flows.length > 0 && recentCustomChecks?.result?.length > 0)
    ? recentCustomChecks.result
      .map(r => r.result.status === 'success' ? 100 : 0)
      .reduce((p, c) => p + c, 0) / recentCustomChecks.result.length
    : null

  const chartData = [{
    name: 'Uptime',
    Score: Math.round((uptimes.filter(u => u.result.status === 'success').length / uptimes.length) * 100)
  }, {
    name: 'Security',
    Score: securityScore
  }, {
    name: 'DNS',
    Score: dnsScore
  }, {
    name: 'Page Security',
    Score: pageSecurityScore
  }, linkScore !== null && {
    name: 'Links',
    Score: linkScore
  }, customScore !== null && {
    name: 'Custom Flows',
    Score: Math.round(customScore)
  }].filter(Boolean)

  return <>
    <RadarChart
      h={{ base: 200, xs: 200, xl: 300 }}
      w={{ base: 320, xs: 320, xl: 400 }}
      data={chartData}
      dataKey="name"
      withPolarRadiusAxis
      series={[{ name: 'Score', color: 'indigo.4', opacity: 0.2 }]}
      withTooltip
      withDots
    />
  </>
}

export default OverviewChart