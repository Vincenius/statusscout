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
  }
}
