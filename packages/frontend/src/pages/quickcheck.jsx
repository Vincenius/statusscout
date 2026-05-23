import { useEffect, useRef, useState } from 'react'
import { useLocation } from "react-router-dom";
import Layout from '@/components/Layout/Layout'
import { Alert, Blockquote, Box, Button, Card, Container, Group, Text, Title } from '@mantine/core'
import { IconInfoCircle } from '@tabler/icons-react'
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
              This quickcheck could not be found.
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
    <Layout title="Quick Check" isPublicRoute logoLink={import.meta.env.VITE_BASE_URL || '/'}>
      <Container size="md" py="md" px={{ base: "0", md: "md" }}>
        <Box>
          <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light" mb="md" px={{ base: "md", md: "md" }}>
            This scan checks publicly visible issues only. It won't catch vulnerabilities in your code or private infrastructure.
          </Alert>

          <Report
            website={{ domain: url }}
            checks={checks}
            status={result}
            isQuickCheck={true}
            quickcheckId={quickcheckId}
          />
        </Box>
      </Container>
    </Layout>
  )
}

export default QuickCheck
