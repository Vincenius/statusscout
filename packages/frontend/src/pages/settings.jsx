import Layout from '@/components/Layout/Layout'
import { ActionIcon, Badge, Box, Button, Card, Flex, List, Modal, Paper, PasswordInput, Stack, Text, ThemeIcon, Title } from '@mantine/core'
import { IconBell, IconBrandDiscord, IconBrandPowershell, IconBrandSlack, IconLock, IconMail, IconPhone, IconPlus, IconTag, IconTrash, IconUser } from '@tabler/icons-react'
import { useAuthSWR } from '@/utils/useAuthSWR'
import getFormData from '@/utils/getFormData'
import { useEffect, useState } from 'react'
import { useDisclosure } from '@mantine/hooks'
import { Link } from 'react-router-dom'
import { notifications } from '@mantine/notifications';
import NewNotificationChannelModal from '@/components/Notifications/NewNotificationChannelModal'
import { notificationMap } from '@/utils/checks'

const capitalize = str => str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

const ChannelIconMap = {
  email: IconMail,
  sms: IconPhone,
  ntfy: IconBrandPowershell,
  discord: IconBrandDiscord,
  slack: IconBrandSlack,
}

function Settings() {
  const { data: user = {}, mutate } = useAuthSWR(`${import.meta.env.VITE_API_URL}/v1/user`)
  const { data: websites = [] } = useAuthSWR(`${import.meta.env.VITE_API_URL}/v1/website`)
  const [opened, { open, close }] = useDisclosure(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [channelDeleteWarning, setChannelDeleteWarning] = useState(null);
  const [pwModalOpened, { open: openPwModal, close: closePwModal }] = useDisclosure(false);
  const [error, setError] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState();
  const [deleteUserLoading, setDeleteUserLoading] = useState();
  const [deleteUserWarningOpen, setDeleteUserWarningOpen] = useState(false);
  const [cancelSubscriptionLoading, setCancelSubscriptionLoading] = useState(false);
  const [cancelSubscriptionOpen, setCancelSubscriptionOpen] = useState(false);
  const [undoCancelSubscriptionOpen, setUndoCancelSubscriptionOpen] = useState(false);

  useEffect(() => {
    const url = new URL(window.location.href);
    const verifiedChannel = url.searchParams.get('verifiedChannel');
    if (verifiedChannel !== null) {
      if (verifiedChannel === 'true') {
        notifications.show({
          title: 'Channel verified',
          message: 'Your notification channel has been verified successfully.',
          color: 'green',
        });
      } else {
        notifications.show({
          title: 'Verification failed',
          message: 'Channel verification failed. Please try again or contact support.',
          color: 'red',
        });
      }
      url.searchParams.delete('verifiedChannel');
      window.history.replaceState({}, '', url.pathname + url.search);
    }
  }, []);

  const openModal = e => {
    e.preventDefault();
    open();
  }

  const handleDeleteAccount = () => {
    setDeleteUserLoading(true)
    fetch(`${import.meta.env.VITE_API_URL}/v1/user`, {
      method: 'DELETE',
      credentials: 'include',
    }).then(res => res.json()).then(res => {
      if (res.error) {
        notifications.show({
          title: 'Something went wrong',
          message: 'Your account could not be deleted. Please try again or contact support.',
          color: 'red',
        })
      }
      else {
        notifications.show({
          title: 'Account deleted',
          message: 'Your account has been deleted successfully.',
          color: 'green',
        })
        mutate()
      }
    }).finally(() => {
      setDeleteUserLoading(false)
    })
  }

  const handleDeleteChannel = id => {
    const usedInWebsites = websites.filter(w => w.criticalChannel === id || w.dailyChannel === id)

    if (usedInWebsites.length > 0) {
      setChannelDeleteWarning(id)
    } else {
      deleteChannel(id)
    }
  }

  const deleteChannel = (id) => {
    setDeleteLoading(id)
    fetch(`${import.meta.env.VITE_API_URL}/v1/user/notification-channel?id=${id}`, {
      method: 'DELETE',
      credentials: 'include',
    }).then(res => res.json()).then(res => {
      if (res.error) {
        notifications.show({
          title: 'Something went wrong',
          message: 'Your notification channel could not be deleted. Please try again or contact support.',
          color: 'red',
        })
      }
      else {
        notifications.show({
          title: 'Channel deleted',
          message: 'Your notification channel has been deleted successfully.',
          color: 'green',
        })
        mutate()
      }
    }).finally(() => {
      setDeleteLoading(null)
    })
  }

  const handlePwChange = (e) => {
    e.preventDefault()

    const formData = getFormData(e)
    setError(null)
    setPwLoading(true)

    fetch(`${import.meta.env.VITE_API_URL}/v1/user/password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(formData),
    }).then(res => res.json()).then(res => {
      if (res.error) {
        setError(res.error)
      } else {
        closePwModal()
        notifications.show({
          title: 'Password changed',
          message: 'Your password has been changed successfully.',
          color: 'green',
        })
      }
    }).finally(() => {
      setPwLoading(false)
    })
  }

  const handleCancelSubscription = (type) => {
    setCancelSubscriptionLoading(true)
    
    fetch(`${import.meta.env.VITE_API_URL}/v1/checkout/cancel`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type })
    }).then(res => res.json()).then(res => {
      if (res.error) {
        notifications.show({
          title: 'Something went wrong',
          message: 'Your subscription could not be cancelled. Please try again or contact support.',
          color: 'red',
        })
      } else {
        notifications.show({
          title: type === 'cancel' ? 'Subscription cancelled' : 'Cancellation reverted',
          message: type === 'cancel' ? 'Your subscription has been cancelled successfully.' : 'Your subscription cancellation has been reverted.',
          color: 'green',
        })
        mutate()
        setCancelSubscriptionOpen(false)
      }
    }).finally(() => setCancelSubscriptionLoading(false))
  }

  return (
    <Layout title="Settings">
      <Title order={1} size="h1" ta="center" mb="xl" mt="md">Settings</Title>

      <Box maw={800} mx="auto">
        <Card withBorder p="md" mb="xl" shadow='md'>
          <Card.Section p="md" withBorder>
            <Flex align="center" gap="sm">
              <ThemeIcon size={30} radius="md" variant="light">
                <IconUser size={18} />
              </ThemeIcon>
              <Title order={2} fw="normal">Account</Title>
            </Flex>
          </Card.Section>

          <Card.Section p="md" withBorder>
            <Flex gap="sm" mb="md">
              <ThemeIcon size={24} radius="sm" variant="outline">
                <IconMail size={16} />
              </ThemeIcon>
              <Text><b>E-Mail:</b> {user.email}</Text>
            </Flex>
            <Flex gap="sm" mb="md">
              <ThemeIcon size={24} radius="sm" variant="outline">
                <IconLock size={16} />
              </ThemeIcon>
              <Box>
                <Text><b>Password:</b> ********</Text>
                <Text><a href="#open-pw-modal" onClick={e => {
                  e.preventDefault()
                  openPwModal()
                }}>Change password</a></Text>
              </Box>
            </Flex>
            <Flex gap="sm">
              <ThemeIcon size={24} radius="sm" variant="outline">
                <IconTag size={16} />
              </ThemeIcon>
              <Box>
                <Text><b>Plan:</b> {capitalize(user.subscription?.plan)} {user.subscription?.expiresAt ? ` (expires at ${new Date (user.subscription.expiresAt).toLocaleDateString()})` : '(active)'}</Text>
                <Text>
                  {user.subscription?.plan !== 'pro' && (
                    <Link to="/checkout">Upgrade</Link>
                  )}
                  {user.subscription?.plan === 'pro' && !user.subscription?.expiresAt && (
                    <a href="#cancel-subscription" onClick={e => {
                      e.preventDefault()
                      setCancelSubscriptionOpen(true)
                    }}>Cancel Subscription</a>
                  )}
                  {user.subscription?.plan === 'pro' && user.subscription?.expiresAt && (
                    <a href="#undo-cancel-subscription" onClick={e => {
                      e.preventDefault()
                      setUndoCancelSubscriptionOpen(true)
                    }}>Undo Cancellation</a>
                  )}
                </Text>
              </Box>
            </Flex>

            <Button color="red" variant="outline" mt="xl" onClick={() => setDeleteUserWarningOpen(true)}>
              Delete Account
            </Button>
          </Card.Section>
        </Card>
        <Card withBorder p="md" mb="md" shadow='md'>
          <Card.Section p="md" withBorder>
            <Flex align="center" gap="sm">
              <ThemeIcon size={30} radius="md" variant="light">
                <IconBell size={18} />
              </ThemeIcon>
              <Title order={2} fw="normal">Notifications</Title>
            </Flex>
          </Card.Section>

          <Card.Section p="md" withBorder>
            <Text c="dimmed" size="sm" mb="md">
              Channels you can assign to websites for critical alerts and daily digests.
            </Text>

            <Stack gap="xs" mb="md">
              <Paper withBorder p="sm" radius="sm">
                <Flex align="center" gap="sm">
                  <ThemeIcon size={28} radius="sm" variant="light" color="blue">
                    <IconMail size={16} />
                  </ThemeIcon>
                  <Box flex={1}>
                    <Flex align="center" gap="xs">
                      <Badge size="sm" color="blue" variant="light">E-Mail</Badge>
                      <Text size="sm">{user.email}</Text>
                    </Flex>
                    <Text size="xs" c="dimmed">Primary email — always available</Text>
                  </Box>
                </Flex>
              </Paper>

              {(user.notificationChannels || []).map((channel, index) => {
                const ChannelIcon = ChannelIconMap[channel.type] || IconMail
                const meta = notificationMap[channel.type]
                const isWebhook = channel.type === 'discord' || channel.type === 'slack'
                const displayValue = isWebhook ? 'Webhook configured' : channel.value
                const usedBy = websites.filter(w => w.criticalChannel === channel.id || w.dailyChannel === channel.id)

                return (
                  <Paper withBorder p="sm" radius="sm" key={`channel-${index}`}>
                    <Flex align="center" gap="sm">
                      <ThemeIcon size={28} radius="sm" variant="light" color={meta?.color || 'gray'}>
                        <ChannelIcon size={16} />
                      </ThemeIcon>
                      <Box flex={1}>
                        <Flex align="center" gap="xs" wrap="wrap">
                          <Badge size="sm" color={meta?.color || 'gray'} variant="light">{meta?.name || channel.type}</Badge>
                          {channel.verified
                            ? <Text size="sm">{displayValue}</Text>
                            : <Badge size="sm" color="orange" variant="light">Pending verification</Badge>
                          }
                        </Flex>
                        {usedBy.length > 0 && (
                          <Text size="xs" c="dimmed" mt={2}>Used by: {usedBy.map(w => w.domain).join(', ')}</Text>
                        )}
                      </Box>
                      <ActionIcon loading={deleteLoading === channel.id} color="red" variant="subtle" size="sm" onClick={() => handleDeleteChannel(channel.id)}>
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Flex>
                  </Paper>
                )
              })}
            </Stack>

            <Button variant="light" leftSection={<IconPlus size={16} />} onClick={openModal} size="sm">
              Add Channel
            </Button>
          </Card.Section>
        </Card>
      </Box>

      <NewNotificationChannelModal opened={opened} close={close} />

      <Modal size="sm" title="Change Password" opened={pwModalOpened} onClose={closePwModal}>
        <form onSubmit={handlePwChange}>
          <PasswordInput
            name="currentPassword"
            required
            label="Current Password"
            placeholder="Enter current password"
            type="password"
            mb="xs"
          />
          <Text size="xs" mb="md"><Link to="/forgot-password">Forgot password?</Link></Text>
          <PasswordInput
            name="newPassword"
            required
            mb="lg"
            label="New Password"
            placeholder="Enter new password"
            type="password"
            description="Min. 8 characters"
            minLength={8}
          />

          {error && <Text c="red" mb="md">{error}</Text>}

          <Button type="submit" loading={pwLoading}>Change Password</Button>
        </form>
      </Modal>

      <Modal size="sm" title="Cancel Subscription" opened={cancelSubscriptionOpen} onClose={() => setCancelSubscriptionOpen(false)}>
        <Text mb="md">Cancelling your subscription will immediately stop future billing. Your Pro features may remain active until the end of the current billing period depending on your plan. You can re-subscribe anytime.</Text>

        <Flex justify="flex-end" gap="sm">
          <Button variant="outline" onClick={() => setCancelSubscriptionOpen(false)} disabled={cancelSubscriptionLoading}>Close</Button>
          <Button color="red" loading={cancelSubscriptionLoading} onClick={() => handleCancelSubscription('cancel')}>Cancel Subscription</Button>
        </Flex>
      </Modal>

      <Modal size="sm" title="Undo Cancellation" opened={undoCancelSubscriptionOpen} onClose={() => setUndoCancelSubscriptionOpen(false)}>
        <Text mb="md">You’re about to undo your cancellation. This means your subscription will remain active and renew as usual.</Text>

        <Flex justify="flex-end" gap="sm">
          <Button variant="outline" onClick={() => setUndoCancelSubscriptionOpen(false)} disabled={cancelSubscriptionLoading}>Close</Button>
          <Button color="red" loading={cancelSubscriptionLoading} onClick={() => handleCancelSubscription('revert-cancel')}>Undo Cancellation</Button>
        </Flex>
      </Modal>

      <Modal size="sm" title="Delete Notification Channel" opened={!!channelDeleteWarning} onClose={() => setChannelDeleteWarning(null)}>
        <Text mb="md">This notification channel is still in use by one or more websites. Are you sure you want to delete it? Following websites are affected:</Text>

        <List mb="xl">
          {websites
            .filter(w => w.criticalChannel === channelDeleteWarning || w.dailyChannel === channelDeleteWarning)
            .map((website) => (
              <List.Item key={`delete-warning-${website.id}`}>{website.domain}</List.Item>
            ))}
        </List>
        <Flex justify="flex-end" gap="sm">
          <Button variant="outline" onClick={() => setChannelDeleteWarning(null)}>Cancel</Button>
          <Button color="red" loading={deleteLoading === channelDeleteWarning} onClick={() => {
            deleteChannel(channelDeleteWarning)
            setChannelDeleteWarning(null)
          }}>Delete Channel</Button>
        </Flex>
      </Modal>

      <Modal size="sm" title="Delete Account" opened={deleteUserWarningOpen} onClose={() => setDeleteUserWarningOpen(false)}>
        <Text mb="md">This action cannot be undone. Deleting your account will permanently remove your data and automatically cancel any active plans associated with your account.</Text>

        <Flex justify="flex-end" gap="sm">
          <Button variant="outline" onClick={() => setDeleteUserWarningOpen(false)} disabled={deleteUserLoading}>
            Cancel
          </Button>
          <Button color="red" loading={deleteUserLoading} onClick={() => {
            setDeleteUserWarningOpen(false)
            handleDeleteAccount()
          }}>Delete Account</Button>
        </Flex>
      </Modal>
    </Layout>
  )
}

export default Settings
