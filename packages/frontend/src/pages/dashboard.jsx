import Layout from '@/components/Layout/Layout'
import { Box, Card, Flex, Title, Text, Button, Blockquote, ThemeIcon, Tooltip } from '@mantine/core'
import { useAuthSWR } from '@/utils/useAuthSWR'
import { Link } from 'react-router-dom'
import { useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import CreateWebsite from '@/components/Website/CreateWebsite';

function timeAgo(dateString) {
  const seconds = Math.floor((Date.now() - new Date(dateString)) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

const UPTIME_DOT = {
  success: { color: 'var(--mantine-color-green-6)', label: 'Online' },
  fail:    { color: 'var(--mantine-color-red-6)',   label: 'Down'   },
  null:    { color: 'var(--mantine-color-gray-4)',  label: 'No data yet' },
}

function WebsiteCard({ website }) {
  const hostname = new URL(website.domain).hostname
  const dot = UPTIME_DOT[website.uptimeStatus] ?? UPTIME_DOT.null

  return (
    <Card
      key={website.domain}
      withBorder
      p="md"
      mb="md"
      shadow="md"
      style={{ maxWidth: 500, flex: '1 1 calc(33% - 1rem)', display: 'flex', flexDirection: 'column' }}
    >
      <Flex justify="space-between" align="flex-start" mb="xs" gap="sm">
        <Flex align="center" gap="xs" style={{ overflow: 'hidden', flex: 1 }}>
          <Tooltip label={dot.label} withArrow>
            <Box
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: dot.color,
                flexShrink: 0,
              }}
            />
          </Tooltip>
          <Title
            order={3}
            style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            <Link to={`/website/${website.index}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              {hostname}
            </Link>
          </Title>
        </Flex>

        {website.score && (
          <Tooltip label={`Security score: ${website.score.score}/100 — ${website.score.label}`} withArrow>
            <ThemeIcon color={website.score.color} size={32} radius="sm" style={{ flexShrink: 0 }}>
              <Text fw={700} size="sm" style={{ lineHeight: 1 }}>{website.score.grade}</Text>
            </ThemeIcon>
          </Tooltip>
        )}
      </Flex>

      <Text size="sm" c="dimmed" style={{ flex: 1 }}>
        {website.recentCheck ? `Last checked ${timeAgo(website.recentCheck)}` : 'No checks yet'}
      </Text>

      <Button variant="outline" size="sm" component={Link} to={`/website/${website.index}`} mt="md">
        View Details
      </Button>
    </Card>
  )
}

function Dashboard() {
  const { data: websites = [] } = useAuthSWR(`${import.meta.env.VITE_API_URL}/v1/website`)
  const { data: user } = useAuthSWR(`${import.meta.env.VITE_API_URL}/v1/user`)

  useEffect(() => {
    const url = new URL(window.location.href);
    const subscription = url.searchParams.get('subscription');
    if (subscription !== null) {
      if (subscription === 'true') {
        notifications.show({
          title: 'Pro subscription purchased',
          message: 'Thank you — your Pro subscription is active. Enjoy premium features!',
          color: 'green',
        });
      } else {
        notifications.show({
          title: 'Pro purchase failed',
          message: 'We could not complete your Pro purchase. Please try again or contact support.',
          color: 'red',
        });
      }
      url.searchParams.delete('subscription');
      window.history.replaceState({}, '', url.pathname + url.search);
    }
  }, []);

  return (
    <Layout title="Dashboard">
      {websites.length === 0 ? (
        <>
          <Title order={1} ta="center" mt="xl" mb="xs">Welcome to StatusScout!</Title>
          <Text ta="center" c="dimmed">Thanks for signing up. Add your first website to start monitoring.</Text>
          <CreateWebsite title="Add your first website" />
        </>
      ) : (
        <>
          <Title order={1} size="h1" ta="center" mb="xl" mt="md">Dashboard</Title>
          <Box maw={1800} mx="auto">
            {!user?.isProUser && <Blockquote maw={600} mx="auto" mb="xl">
              <Text fw={500} mb="md">Your Pro subscription expired. Please renew your subscription to continue using premium features like getting notifications.</Text>
              <Button component={Link} to="/checkout">Buy Pro Subscription</Button>
            </Blockquote>}
            <Title order={2} mb="md" fw="normal">Your Websites</Title>
            <Flex gap="md" direction="row" wrap="wrap" mb="md">
              {websites.map(website => (
                <WebsiteCard key={website.domain} website={website} />
              ))}
            </Flex>
          </Box>
        </>
      )}
    </Layout>
  )
}

export default Dashboard
