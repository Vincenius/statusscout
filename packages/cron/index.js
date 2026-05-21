import 'dotenv/config'
import { connectDB, disconnectDB } from './db.js'
import cron from 'node-cron'
import { Queue } from 'bullmq'
import IORedis from 'ioredis'

const connection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
})

const queue = new Queue('checks', { connection })

async function tryRun(type) {
  try {
    const db = await connectDB()
    const now = new Date()
    const users = await db.collection('users').find({
      confirmed: true,
      $or: [
        { 'subscription.expiresAt': { $gt: now } },
        { 'subscription.expiresAt': { $exists: false } },
        { 'subscription.expiresAt': null },
      ],
      'subscription.plan': { $in: ['pro', 'trial'] }
    }).toArray();

    console.log('run', type, 'check for', users.length, 'users')

    for (const user of users) {
      const websites = await db.collection('websites').find({
        userId: user._id,
        deleted: { $ne: true }
      }).toArray()

      for (const website of websites) {
        const jobData = {
          type,
          websiteId: website._id,
        }
        const job = await queue.add('cron-triggered-job', jobData)
        console.log(`Enqueued ${type} for domain ${website.domain}, job: ${job.id}`)
      }
    }
  } catch (e) {
    console.error(e)
  }
}

async function runNotifications() {
  try {
    const db = await connectDB()
    const now = new Date()
    const users = await db.collection('users').find({
      confirmed: true,
      $or: [
        { 'subscription.expiresAt': { $gt: now } },
        { 'subscription.expiresAt': { $exists: false } },
        { 'subscription.expiresAt': null },
      ],
      'subscription.plan': { $in: ['pro', 'trial'] }
    }).toArray();

    for (const user of users) {
      const websites = await db.collection('websites').find({
        userId: user._id,
        deleted: { $ne: true }
      }).toArray()

      for (const website of websites) {
        const jobData = {
          type: 'daily-notification',
          websiteId: website._id,
        }
        const job = await queue.add('cron-triggered-job', jobData)
        console.log(`Enqueued daily-notification for domain ${website.domain}, job: ${job.id}`)
      }
    }
  } catch (e) {
    console.error(e)
  }
}

async function cleanUp() {
  try {
    console.log('run cleanup')
    const monthAgo = new Date()
    monthAgo.setHours(0, 0, 0, 0)
    monthAgo.setMonth(monthAgo.getMonth() - 1)

    const db = await connectDB()
    const oldChecks = await db.collection('checks')
      .deleteMany({ createdAt: { $lte: monthAgo.toISOString() } })

    console.log('deleted', oldChecks.deletedCount, 'old checks')
  } catch (e) {
    console.error(e)
  }
}

async function runTrialCheck() {
  try {
    const db = await connectDB()
    const startOfTomorrow = new Date()
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1)
    startOfTomorrow.setHours(0, 0, 0, 0)
    const endOfTomorrow = new Date(startOfTomorrow)
    endOfTomorrow.setHours(23, 59, 59, 999)

    const users = await db.collection('users').find({
      confirmed: true,
      'subscription.plan': 'trial',
      'subscription.expiresAt': { $gte: startOfTomorrow, $lte: endOfTomorrow },
      'unsubscribed': { $ne: true },
    }).toArray()

    console.log('checking for users with trial ending tomorrow, found', users.length)

    if (users.length > 0) {
      await fetch(`${process.env.API_URL}/v1/notification/trial`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.API_KEY
        },
        body: JSON.stringify({ users })
      })
    }
  } catch (e) {
    console.error('error on trial check', e)
  }
}

async function runFeedbackCheck() {
  try {
    const db = await connectDB()
    // three days after signup
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
    threeDaysAgo.setHours(0, 0, 0, 0)
    const startOfThreeDaysAgo = new Date(threeDaysAgo)
    const endOfThreeDaysAgo = new Date(threeDaysAgo)
    endOfThreeDaysAgo.setHours(23, 59, 59, 999)

    const users = await db.collection('users').find({
      confirmed: true,
      'createdAt': { $gte: startOfThreeDaysAgo, $lte: endOfThreeDaysAgo },
      'unsubscribed': { $ne: true },
    }).toArray()

    console.log('checking for users three days after signup, found', users.length)

    if (users.length > 0) {
      await fetch(`${process.env.API_URL}/v1/notification/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.API_KEY
        },
        body: JSON.stringify({ users })
      })
    }
  } catch (e) {
    console.error('error on trial check', e)
  }
}

// once a day at 03:00:00
cron.schedule('0 0 3 * * *', () => cleanUp())

// once a day at 04:00:00 — full
cron.schedule('0 0 4 * * *', () => tryRun('full'))

// once a day at 05:00:00 — daily
cron.schedule('0 0 5 * * *', () => runNotifications())

// once a day at 10:00:00 — daily
cron.schedule('0 0 10 * * *', () => {
  if (process.env.SEND_EMAILS === 'true' || process.env.SEND_EMAILS === true) {
    runTrialCheck()
    runFeedbackCheck()
  }
})

// every 6 hours at :00:10 — full
cron.schedule('10 0 */6 * * *', () => tryRun('full'))

// every 5 minutes at :00:20 — quick
cron.schedule('20 */5 * * * *', () => tryRun('quick'))

// run once immediately
cleanUp()
// runNotifications()
// runTrialCheck()
// runFeedbackCheck()

const shutdown = async () => {
  console.log('Shutting down gracefully...');
  await disconnectDB();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
