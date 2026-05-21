import Layout from '@/components/Layout/Layout'
import { useParams } from 'react-router-dom';
import { Button, Card, Container, Flex, LoadingOverlay, Text, Title } from '@mantine/core'
import { useAuthSWR } from '@/utils/useAuthSWR'
import Report from '@/components/Report/Report';
import Website404 from '@/components/Website/Website404';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from "react-router-dom";

function ReportPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const jobIdQueryParam = searchParams.get("j_id");
  const [jobId, setJobId] = useState(jobIdQueryParam);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef(null);
  const { data: user } = useAuthSWR(`${import.meta.env.VITE_API_URL}/v1/user`)
  const { data: websites = [], isLoading: isLoadingWebsites } = useAuthSWR(`${import.meta.env.VITE_API_URL}/v1/website`)
  const website = websites.find(w => w.index === id)
  const { data: checkData = {}, isLoading: isLoadingChecks, mutate } = useAuthSWR(`${import.meta.env.VITE_API_URL}/v1/check?id=${id}${jobId ? `&jobId=${jobId}` : '&history=true'}`)

  const { checks = [], status = {} } = checkData

  useEffect(() => {
    // Start polling only if checks are not completed & polling hasn't already started
    if (status?.state === 'completed' || status?.state === 'failed' || intervalRef.current) return;

    intervalRef.current = setInterval(async () => {
      try {
        mutate()
      } catch (error) {
        console.error('Error fetching check status:', error);
      }
    }, 3000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [status?.state]);

  const generateReport = async () => {
    if (jobId) {
      searchParams.delete("j_id");
      window.history.replaceState({}, '', `${window.location.pathname}?${searchParams.toString()}`);
    }

    setLoading(true);
    await fetch(`${import.meta.env.VITE_API_URL}/v1/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ id: website.id })
    }).then(res => res.json())
      .then(data => {
        if (data?.jobId) {
          setJobId(data.jobId);
        }
      }).finally(() => {
        mutate();
        setLoading(false);
      });
  }

  if (!isLoadingWebsites && !website) {
    return (
      <Website404 />
    )
  }

  return (
    <Layout title="Website Report">
      <Container size="md" py="md" px={{ base: "0", md: "md" }}>
        {(isLoadingWebsites || isLoadingChecks) && <LoadingOverlay />}
        {!isLoadingWebsites && !website && <Card p="md" withBorder maw={600}>
          <Title order={2} mb="md">Website not found</Title>
          <Text>It looks like you're using an invalid URL. Please choose a valid website from the list in the navigation.</Text>
        </Card>}

        {!isLoadingWebsites && !isLoadingChecks && <>
          <Flex justify="flex-end" mb="md">
            <Button
              onClick={generateReport}
              loading={loading}
              disabled={status?.state === 'active' || !user.isProUser}
            >
              Generate new Report
            </Button>
          </Flex>
          <Report
            website={website}
            checks={checks}
            status={status}
          />
        </>}
      </Container>
    </Layout>
  )
}

export default ReportPage
