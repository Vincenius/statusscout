import { Accordion, Badge, Box, Button, Card, Collapse, Divider, Flex, List, Loader, Select, SegmentedControl, Stack, Text, ThemeIcon } from '@mantine/core';
import { useAuthSWR } from '@/utils/useAuthSWR'
import { useDisclosure } from '@mantine/hooks';
import { useState } from 'react';
import { IconBellRinging, IconCalendarStats, IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { notificationMap } from '@/utils/checks';
import { checkDefaultNotifications, checkNameMap } from '@statusscout/shared';
import NewNotificationChannelModal from '@/components/Notifications/NewNotificationChannelModal'
import InfoPopover from '@/components/InfoPopover/InfoPopover'

const WEBHOOK_SETUP = {
  discord: [
    'Right-click your Discord channel → Edit Channel',
    'Go to Integrations → Webhooks → New Webhook',
    'Click Copy Webhook URL and paste it when adding a channel',
  ],
  slack: [
    'Go to api.slack.com/apps → Create New App',
    'Enable Incoming Webhooks, then Add New Webhook to Workspace',
    'Copy the Webhook URL and paste it when adding a channel',
  ],
}

const channelSelectLabel = (c) => {
  const meta = notificationMap[c.type]
  const isWebhook = c.type === 'discord' || c.type === 'slack'
  const value = isWebhook ? 'Webhook' : c.value
  const status = c.verified ? value : 'Not verified'
  return `${meta?.name || c.type} — ${status}`
}


const NotificationChannel = ({ website, user, loading, onChange, channelType, name, description, icon, iconColor, onlyEmail, openChannel }) => {
  const selectData = [
    { value: 'email', label: `E-Mail — ${user.email}` },
    ...(user.notificationChannels || [])
      .filter(c => onlyEmail ? c.type === 'email' : true)
      .map(c => ({ value: c.id, label: channelSelectLabel(c), disabled: !c.verified })),
    { value: 'disabled', label: 'Disabled' },
    { value: 'add', label: '+ Add New Channel' },
  ]

  const handleChange = (value) => {
    if (value === 'add') { openChannel(); return }
    onChange(value, channelType)
  }

  const currentValue = website?.[channelType] || 'disabled'

  return (
    <Card withBorder p="md" radius="md">
      <Flex gap="md" align="flex-start">
        <ThemeIcon size={38} radius="md" variant="light" color={iconColor} style={{ flexShrink: 0 }}>
          {icon}
        </ThemeIcon>
        <Box flex={1} style={{ minWidth: 0 }}>
          <Text fw={600} size="sm" mb={2}>{name}</Text>
          <Text size="xs" c="dimmed" mb="sm">{description}</Text>
          <Select
            size="xs"
            value={currentValue}
            onChange={handleChange}
            disabled={loading}
            rightSection={loading ? <Loader size={12} /> : undefined}
            data={selectData}
          />
        </Box>
      </Flex>
    </Card>
  )
}

function NotificationSettings({ websiteId, children, noBorder }) {
  const [channelOpened, { open: openChannel, close: closeChannel }] = useDisclosure(false);
  const [channelLoading, setChannelLoading] = useState(null);
  const [onlyEmail, setOnlyEmail] = useState(false);
  const [prioritiesOpen, setPrioritiesOpen] = useState(false);
  const { data: websites = [], mutate } = useAuthSWR(`${import.meta.env.VITE_API_URL}/v1/website`)
  const { data: user = {} } = useAuthSWR(`${import.meta.env.VITE_API_URL}/v1/user`)
  const website = websites.find(w => w.id === websiteId)
  const { data: flows = [] } = useAuthSWR(website?.index && `${import.meta.env.VITE_API_URL}/v1/flows?websiteId=${website.index}`)

  const handleChannelChange = (value, type) => {
    setChannelLoading(type)
    fetch(`${import.meta.env.VITE_API_URL}/v1/website/notification-channel`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel: value, websiteId: website.id, type }),
    }).then(res => { if (res.ok) mutate() })
      .catch(err => console.error(err))
      .finally(() => setChannelLoading(null))
  }

  const handlePrioChange = (value, check) => {
    fetch(`${import.meta.env.VITE_API_URL}/v1/website/notifications`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ check, value, websiteId: website.id }),
    }).catch(err => console.error(err))
  }

  const handleCustomPrioChange = (value, flow) => {
    fetch(`${import.meta.env.VITE_API_URL}/v1/flows`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        check: { ...flow, editId: flow._id, notification: value },
        websiteId: website.id,
      }),
    }).catch(err => console.error(err))
  }

  const customizedCount = website ? Object.entries(checkDefaultNotifications).filter(
    ([check, def]) => website.notifications?.[check] && website.notifications[check] !== def
  ).length : 0

  return (
    <Card withBorder={!noBorder} shadow={noBorder ? 'none' : 'md'}>
      <Card.Section p="md" withBorder={!noBorder}>
        {children}
      </Card.Section>

      <Card.Section p="md" withBorder={!noBorder}>
        <Stack gap="sm">
          <NotificationChannel
            website={website}
            user={user}
            loading={channelLoading === 'criticalChannel'}
            onChange={handleChannelChange}
            channelType="criticalChannel"
            name="Critical Alerts"
            description="Sent immediately when a new issue is first detected."
            icon={<IconBellRinging size={20} />}
            iconColor="red"
            openChannel={openChannel}
          />
          <NotificationChannel
            website={website}
            user={user}
            loading={channelLoading === 'dailyChannel'}
            onChange={handleChannelChange}
            channelType="dailyChannel"
            name="Daily Digest"
            description="A summary of all new issues. Email only."
            icon={<IconCalendarStats size={20} />}
            iconColor="blue"
            onlyEmail
            openChannel={() => { setOnlyEmail(true); openChannel() }}
          />
        </Stack>

        <NewNotificationChannelModal
          opened={channelOpened}
          close={() => { closeChannel(); setOnlyEmail(false) }}
          onlyEmail={onlyEmail}
        />
      </Card.Section>

      <Card.Section p="md" withBorder={!noBorder}>
        <Button
          variant="subtle"
          size="xs"
          color="gray"
          rightSection={prioritiesOpen ? <IconChevronUp size={13} /> : <IconChevronDown size={13} />}
          onClick={() => setPrioritiesOpen(v => !v)}
          px={0}
        >
          Per-check priorities
          {customizedCount > 0 && (
            <Badge size="xs" ml="xs" variant="light">{customizedCount} customized</Badge>
          )}
        </Button>

        <Collapse in={prioritiesOpen}>
          <Text size="xs" c="dimmed" mt="sm" mb="md">
            <b>Critical</b> = immediate alert &nbsp;·&nbsp; <b>Daily</b> = morning digest &nbsp;·&nbsp; <b>Disabled</b> = no notification
          </Text>
          <Stack gap={6}>
            {Object.entries(checkDefaultNotifications).map(([check, defaultChannel]) => (
              <Flex key={check} justify="space-between" align="center" gap="sm">
                <Text size="sm" style={{ minWidth: 110 }}>{checkNameMap[check]}</Text>
                <SegmentedControl
                  size="xs"
                  data={[
                    { value: 'critical', label: 'Critical' },
                    { value: 'daily', label: 'Daily' },
                    { value: 'disabled', label: 'Off' },
                  ]}
                  defaultValue={website?.notifications?.[check] || defaultChannel}
                  onChange={e => handlePrioChange(e, check)}
                />
              </Flex>
            ))}

            {flows?.length > 0 && <>
              <Divider my="xs" label="Custom flows" labelPosition="left" />
              {flows.map(flow => (
                <Flex key={flow._id} justify="space-between" align="center" gap="sm">
                  <Text size="sm" style={{ minWidth: 110 }}>{flow.name}</Text>
                  <SegmentedControl
                    size="xs"
                    data={[
                      { value: 'critical', label: 'Critical' },
                      { value: 'daily', label: 'Daily' },
                      { value: 'disabled', label: 'Off' },
                    ]}
                    defaultValue={flow.notification || 'daily'}
                    onChange={e => handleCustomPrioChange(e, flow)}
                  />
                </Flex>
              ))}
            </>}
          </Stack>
        </Collapse>
      </Card.Section>
    </Card>
  )
}

export default NotificationSettings
