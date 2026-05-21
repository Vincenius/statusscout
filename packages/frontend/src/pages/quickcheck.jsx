import { useEffect, useRef, useState } from 'react'
import { useLocation } from "react-router-dom";
import Layout from '@/components/Layout/Layout'
import { Blockquote, Box, Button, Card, Container, Flex, List, Loader, Overlay, Text, Title } from '@mantine/core'
import { trackEvent } from '@/utils/trackEvent'
import { useNavigate, Link } from 'react-router-dom'
import Report from '@/components/Report/Report';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

function QuickCheck() {
  const query = useQuery();
  const navigate = useNavigate();
  const id = query.get("id");
  const [url, setUrl] = useState();
  const [errorCount, setErrorCount] = useState(0);
  const [idError, setIdError] = useState();
  const [result, setResult] = useState({});
  const intervalRef = useRef(null);

  // init logic
  useEffect(() => {
    if (id) {
      fetch(`${import.meta.env.VITE_API_URL}/v1/quickcheck?id=${id}`)
        .then(res => res.json())
        .then(res => {
          if (res.error) {
            setIdError(true)
          } else {
            setResult(res)
            setUrl(res.url)
          }
        });
    } else {
      navigate('/')
    }

  }, [id])

  // Polling logic
  useEffect(() => {
    // Start polling only if we have a quickcheckId and polling hasn't already started
    if (!result?.quickcheckId || result.state === 'completed' || intervalRef.current) return;

    intervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/v1/quickcheck?id=${result.quickcheckId}`);
        const data = await response.json();

        if (data.state === 'completed' || data.state === 'failed') {
          clearInterval(intervalRef.current);
          intervalRef.current = null;

          setResult(data);
          trackEvent('quickcheck-results', { url, state: data.state })
        } else {
          setResult(data);
        }
      } catch (error) {
        setErrorCount(errorCount + 1);
      }
    }, 3000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [result?.quickcheckId, result?.state]);


  if (idError) {
    return (
      <Layout title="Quick Check" isPublicRoute>
        <Box maw={1800} mx="auto" py="xl">
          <Card withBorder shadow="md" maw="600px" mx="auto" p="lg">
            <Title order={2} fw={500} mb="md">Couldn't find this Quickcheck.</Title>
            <Blockquote p="sm" mb="lg">
              It may have been removed. Quickcheck results are automatically deleted after seven days.
            </Blockquote>

            <Button fullWidth component={Link} to="/" c="#fff">
              Start a New Quickcheck
            </Button>
          </Card>
        </Box>
      </Layout>
    )
  }

  const { checks = [], quickcheckId } = result

  return (
    <Layout title="Quick Check" isPublicRoute logoLink="https://statusscout.dev/">
      <Container size="md" py="md" px={{ base: "0", md: "md" }}>
        <Box>
           <Title size="h1" ta="center" mb="sm">Your Security Scan Results</Title>
          {url && <Text size="xl" ta="center" mb="md">
            For <a href={url} target='_blank' rel="noopener noreferrer">{new URL(url).hostname}</a> {checks.length ? <>from  <i>{new Date(checks.length ? checks[0].createdAt : null).toLocaleString()}</i></> : <></>}
          </Text> }

          <Report
            website={{ domain: url }}
            checks={checks}
            status={result}
            isQuickCheck={true}
          />

          <Card withBorder shadow="sm" p="lg" radius="md" mb="md" mt="md">
            <Flex h="100%" direction="column" gap="md" p="md">
              <Title order={2} size="h1" fw="normal" ta="center" mb="md">Keep monitoring — don't just scan once</Title>
              <List size="lg" spacing="sm" mb="md">
                <List.Item>Get alerted the moment new security issues appear</List.Item>
                <List.Item>Continuous checks every 5 minutes, 6 hours, and daily</List.Item>
                <List.Item>Simulate signups and checkouts with custom test flows</List.Item>
              </List>
              <Button size="lg" component={Link} to={'/register'}>
                Start Free 14-Day Trial
              </Button>
              <Text fz="sm">
                * No credit card required. Cancel anytime.
              </Text>
            </Flex>
          </Card>
        </Box>
      </Container>
    </Layout>
  )
}

export default QuickCheck
