import { getNotificationMessage } from "@statusscout/shared"

const getMessage = ({ type, website, notifications }) => {
  const websiteName = website?.domain || 'your website'
  return `[StatusScout] New ${type} issues detected on ${websiteName}:\n\n${notifications.map(n => `• ${getNotificationMessage(n)}`).join('\n')}\n\nRead the report here: ${process.env.APP_URL}/website/${website?.index}/report`
}

export const sendNotifications = async ({ db, type, website, notifications }) => {
  const user = await db.collection('users').findOne({ _id: website.userId })
  const channel = type === 'critical' ? website?.criticalChannel : website?.dailyChannel
  const activeChannel = channel === 'email'
    ? { type: 'email', value: user?.email }
    : (user?.notificationChannels || []).find(c => c.id === channel)

  if (!activeChannel || !activeChannel?.value) {
    console.log(`No ${type} notification channel set for ${website.domain}, skipping notifications.`)
    return
  }

  if (channel === 'email' && !user?.confirmed) {
    console.log(`User email not confirmed, skipping ${type} notifications for ${website.domain}.`)
    return
  }

  if (channel !== 'email' && !activeChannel.verified) {
    console.log(`Notification channel not verified, skipping ${type} notifications for ${website.domain}.`)
    return
  }

  console.log(`Sending ${type} notifications for ${website.domain} via ${activeChannel.type}`)

  if (activeChannel.type === 'email' || activeChannel.type === 'sms') {
    await fetch(`${process.env.API_URL}/v1/notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.API_KEY
      },
      body: JSON.stringify({
        type,
        channel: activeChannel,
        notifications,
        website
      })
    }).catch(err => {
      console.error('Error sending notification:', err)
    })
  } else if (activeChannel.type === 'ntfy') {
    await fetch(`https://ntfy.sh/${activeChannel.value}`, {
      method: 'POST',
      body: getMessage({ type, website, notifications })
    })
  } else if (activeChannel.type === 'slack') {
    const websiteName = website?.domain || 'your website'
    const icon = type === 'critical' ? ':red_circle:' : ':large_yellow_circle:'
    await fetch(activeChannel.value, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `${icon} *New ${type} issues on ${websiteName}:*\n${notifications.map(n => `• ${getNotificationMessage(n)}`).join('\n')}`,
            },
          },
          {
            type: 'actions',
            elements: [{
              type: 'button',
              text: { type: 'plain_text', text: 'View Report' },
              url: `${process.env.APP_URL}/website/${website?.index}/report`,
            }],
          },
        ],
      })
    }).catch(err => {
      console.error('Error sending Slack notification:', err)
    })
  } else if (activeChannel.type === 'discord') {
    const websiteName = website?.domain || 'your website'
    const color = type === 'critical' ? 0xe74c3c : 0xe67e22
    await fetch(activeChannel.value, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{
          title: `${type === 'critical' ? '🔴' : '🟡'} New ${type} issues on ${websiteName}`,
          description: notifications.map(n => `• ${getNotificationMessage(n)}`).join('\n'),
          color,
          url: `${process.env.APP_URL}/website/${website?.index}/report`,
          footer: { text: 'StatusScout' },
          timestamp: new Date().toISOString(),
        }]
      })
    }).catch(err => {
      console.error('Error sending Discord notification:', err)
    })
  }
}
