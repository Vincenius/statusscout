import { Alert, Anchor, Button, List, Modal, PinInput, Select, Text, TextInput } from '@mantine/core'
import { IconInfoCircle } from '@tabler/icons-react'
import { notificationMap } from '@/utils/checks'
import { useState } from 'react';
import { notifications } from '@mantine/notifications';
import { useAuthSWR } from '@/utils/useAuthSWR'
import getFormData from '@/utils/getFormData'

const SETUP_GUIDE = {
  discord: {
    title: 'How to get a Discord webhook URL',
    steps: [
      'Open your Discord server and right-click the channel you want alerts in',
      'Click Edit Channel → Integrations → Webhooks → New Webhook',
      'Give it a name (e.g. "StatusScout") then click Copy Webhook URL',
      'Paste the URL in the field below',
    ],
  },
  slack: {
    title: 'How to get a Slack webhook URL',
    steps: [
      <>Go to <Anchor size="xs" href="https://api.slack.com/apps" target="_blank" rel="noopener">api.slack.com/apps</Anchor> → Create New App → From scratch</>,
      'Under Add features, open Incoming Webhooks and toggle it on',
      'Click Add New Webhook to Workspace, pick a channel, then Allow',
      'Copy the Webhook URL and paste it below',
    ],
  },
  ntfy: {
    title: 'How ntfy works',
    steps: [
      'Choose any topic name — this is your unique identifier (e.g. "my-alerts")',
      <>Subscribe to it in the ntfy app (<Anchor size="xs" href="https://ntfy.sh" target="_blank" rel="noopener">ntfy.sh</Anchor>) or via the mobile app</>,
      'Enter the topic name below — not the full URL, just the topic',
    ],
  },
}

function NewNotificationChannelModal({ opened, close, onlyEmail }) {
  const { mutate } = useAuthSWR(`${import.meta.env.VITE_API_URL}/v1/user`)
  const [loading, setLoading] = useState(false);
  const [channel, setChannel] = useState('email');
  const [verificationStep, setVerificationStep] = useState(false);
  const [error, setError] = useState(null);

  const closeModal = () => {
    setVerificationStep(null)
    setError(null)
    setLoading(false)
    setChannel('email')
    close()
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    setLoading(true)
    const formData = getFormData(e)

    fetch(`${import.meta.env.VITE_API_URL}/v1/user/notification-channel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(formData),
    }).then(res => res.json()).then(res => {
      if (res.error) {
        setError(res.error)
      } else {
        if (formData.type === 'sms' || formData.type === 'email') {
          setVerificationStep(formData)
        } else {
          closeModal()
          notifications.show({
            title: 'Channel added',
            message: 'Your notification channel has been added successfully.',
            color: 'green',
          })
          mutate()
        }
      }
    }).finally(() => {
      setLoading(false)
    })
  }

  const handleVerifySubmit = (e) => {
    e.preventDefault()

    const formData = getFormData(e)
    setError(null)
    setLoading(true)
    fetch(`${import.meta.env.VITE_API_URL}/v1/user/verify-phone-number`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        code: formData.verificationCode,
        number: verificationStep.value
      }),
    }).then(res => res.json()).then(res => {
      if (res.error) {
        setError(res.error)
      } else {
        closeModal()
        setVerificationStep(null)
        notifications.show({
          title: 'Channel added',
          message: 'Your notification channel has been added and verified successfully.',
          color: 'green',
        })
        mutate()
      }
    }).finally(() => {
      setLoading(false)
    })
  }

  const guide = SETUP_GUIDE[channel]

  return (
    <Modal size="sm" title="Add Notification Channel" opened={opened} onClose={closeModal}>
      {!verificationStep && <form onSubmit={handleSubmit}>
        <Select
          name="type"
          required
          mb="md"
          label="Channel type"
          value={channel}
          onChange={setChannel}
          data={[
            { value: 'email', label: 'E-Mail' },
            { value: 'sms', label: 'SMS', disabled: onlyEmail },
            { value: 'ntfy', label: 'ntfy', disabled: onlyEmail },
            { value: 'discord', label: 'Discord', disabled: onlyEmail },
            { value: 'slack', label: 'Slack', disabled: onlyEmail },
            { value: 'whatsapp', label: 'WhatsApp (coming soon)', disabled: true },
          ]}
        />

        {guide && (
          <Alert icon={<IconInfoCircle size="1rem" />} title={guide.title} color="blue" mb="md" p="sm">
            <List size="xs" spacing={4}>
              {guide.steps.map((step, i) => (
                <List.Item key={i}>{step}</List.Item>
              ))}
            </List>
          </Alert>
        )}

        <TextInput
          name="value"
          required
          mb="lg"
          label={notificationMap[channel]?.label || 'Value'}
          placeholder={notificationMap[channel]?.placeholder || 'Enter value'}
          type={notificationMap[channel]?.type || 'text'}
          description={channel === 'email' ? 'A verification link will be sent to this address.' : channel === 'sms' ? 'A verification code will be sent to this number.' : null}
        />

        {error && <Text c="red" mb="md">{error}</Text>}

        <Button type="submit" loading={loading}>Add Channel</Button>
      </form>}

      {verificationStep?.type === 'sms' && <form onSubmit={handleVerifySubmit}>
        <Text mb="md">A verification code has been sent to your phone. Please enter it below to verify your phone number.</Text>
        <PinInput type="number" length={6} name="verificationCode" mb="md" />

        {error && <Text c="red" mb="md">{error}</Text>}

        <Button type="submit" loading={loading} mt="lg">Submit Code</Button>
      </form>}

      {verificationStep?.type === 'email' && <div>
        <Text mb="md">We've sent a verification link to your email. Please check your inbox and click the link to verify your email address.</Text>
        <Button onClick={closeModal}>Close</Button>
      </div>}
    </Modal>
  )
}

export default NewNotificationChannelModal
