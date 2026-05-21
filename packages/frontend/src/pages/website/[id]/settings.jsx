import { Button, Card, Container, Flex, Group, LoadingOverlay, Switch, Text, TextInput, Title, Modal, ThemeIcon } from '@mantine/core';
import Layout from '@/components/Layout/Layout';
import Website404 from '@/components/Website/Website404';
import { useAuthSWR } from '@/utils/useAuthSWR'
import { useParams } from 'react-router-dom';
import { useDisclosure } from '@mantine/hooks';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'
import NotificationSettings from '@/components/Notifications/NotificationSettings'
import { IconBell, IconShare3 } from '@tabler/icons-react';

function WebsiteSettings() {
  const navigate = useNavigate();
  const [opened, { open, close }] = useDisclosure(false);
  const [loading, setLoading] = useState(false);
  const [publicReport, setPublicReport] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const { id } = useParams();
  const { data: websites = [], isLoading: isLoadingWebsites, mutate } = useAuthSWR(`${import.meta.env.VITE_API_URL}/v1/website`)
  const website = websites.find(w => w.index === id)
  const host = website ? new URL(website.domain).hostname : '';

  useEffect(() => {
    if (website) setPublicReport(website.publicReport || false)
  }, [website?.publicReport])

  if (!isLoadingWebsites && !website) {
    return (
      <Website404 />
    )
  }

  const handlePublicReportToggle = async () => {
    setToggling(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/v1/website/public-report`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ websiteId: website.id }),
      })
      const data = await res.json()
      setPublicReport(data.publicReport)
      mutate()
    } finally {
      setToggling(false)
    }
  }

  const shareUrl = `${window.location.origin}/report/${host}`

  const copyShareUrl = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopiedUrl(true)
    setTimeout(() => setCopiedUrl(false), 2000)
  }

  const handleDelete = async () => {
    setLoading(true);
    await fetch(`${import.meta.env.VITE_API_URL}/v1/website?id=${website.id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    mutate();
    setLoading(false);
    close();
    navigate('/dashboard');
  }

  return (
    <Layout title="Website Settings">
      {isLoadingWebsites && <LoadingOverlay />}
      {!isLoadingWebsites && <>
        <Container size="md" py="md" px={{ base: "0", md: "md" }}>
          <Title size="h1" ta="center" mb="xl">Settings for {host}</Title>

          <NotificationSettings websiteId={website.id}>
            <Flex align="center" gap="sm">
              <ThemeIcon size={30} radius="md" variant="light">
                <IconBell size={18} />
              </ThemeIcon>
              <Title order={2} fw="normal">Notification Settings</Title>
            </Flex>
          </NotificationSettings>

          <Card withBorder mt="xl" p="lg">
            <Flex align="center" gap="sm" mb="md">
              <ThemeIcon size={30} radius="md" variant="light">
                <IconShare3 size={18} />
              </ThemeIcon>
              <Title order={2} fw="normal">Public Report</Title>
            </Flex>

            <Group justify="space-between" wrap="nowrap">
              <Text size="sm" c="dimmed">
                Anyone with the link can view your latest scan results.
              </Text>
              <Switch
                checked={publicReport}
                onChange={handlePublicReportToggle}
                disabled={toggling}
                label="Share public report"
                labelPosition="left"
              />
            </Group>

            {publicReport && (
              <Flex mt="md" gap="sm" align="center">
                <TextInput
                  value={shareUrl}
                  readOnly
                  style={{ flex: 1 }}
                  size="sm"
                />
                <Button size="sm" variant="light" onClick={copyShareUrl}>
                  {copiedUrl ? 'Copied!' : 'Copy'}
                </Button>
              </Flex>
            )}
          </Card>

          <Button color="red" variant="outline" mt="xl" onClick={open}>Delete Website</Button>
        </Container >
      </>}

      <Modal opened={opened} onClose={close} title="Confirm Deletion" centered>
        <Text>Are you sure you want to delete this website?</Text>
        <Text mt="sm">This action cannot be undone.</Text>

        <Flex justify="flex-end" mt="md" gap="sm">
          <Button variant="outline" onClick={close}>Cancel</Button>
          <Button color="red" onClick={handleDelete} loading={loading}>Delete</Button>
        </Flex>
      </Modal>
    </Layout >
  );
}

export default WebsiteSettings;
