import Layout from '@/components/Layout/Layout'
import { Box, Card, Flex, Title, Text, Button, Blockquote } from '@mantine/core'
import { useAuthSWR } from '@/utils/useAuthSWR'
import { Link } from 'react-router-dom'
import { useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import CreateWebsite from '@/components/Website/CreateWebsite';

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
            <Title order={2} mb="md" fw="normal">Your Websites:</Title>
            <Flex gap="md" direction="row" wrap="wrap" mb="md">
              {websites.map(website => (
                <Card key={website.domain} withBorder p="md" mb="md" shadow='md' style={{ maxWidth: 500, textDecoration: 'none', flex: '1 1 calc(33% - 1rem)' }}>
                  <Title order={3}>{new URL(website.domain).hostname}</Title>
                  <Text mb="sm">Last checked at: {website.recentCheck ? new Date(website.recentCheck).toLocaleString() : 'No checks yet'}</Text>
                  <Button variant="outline" component={Link} to={`/website/${website.index}`}>View Details</Button>
                </Card>
              ))}
            </Flex>
          </Box>
        </>
      )}
    </Layout>
  )
}

export default Dashboard
