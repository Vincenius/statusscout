import 'dotenv/config'
import { connectDB } from './db.js'
import { runUptimeCheck } from './checks/uptime.js'
import { runFuzzCheck } from './checks/fuzz.js'
import { runHeaderCheck } from './checks/headers.js'
import { runSslCheck } from './checks/ssl.js'
import { runCustomChecks } from './checks/custom.js'
import { runDnsCheck } from './checks/dns.js'
import { runCookieCheck } from './checks/cookies.js'
import { runMixedContentCheck } from './checks/mixedcontent.js'
import { runPageAnalysisCheck } from './checks/pageanalysis.js'
import { runApiDocsCheck } from './checks/apidocs.js'
import { ObjectId } from 'mongodb'
import { runNotifications, runDailyNotification } from './notification.js'

export const run = async ({ id, triggerName, type = 'quick', websiteId, quickcheckId, url }) => {
  // type: quick | full | free
  try {
    const db = await connectDB()
    const [website] = !url && websiteId
      ? await db.collection('websites').find({ _id: new ObjectId(websiteId) }).toArray()
      : [{ domain: url }] // quickcheck

    const createdAt = new Date().toISOString()
    console.log(createdAt, `run ${type} status check for`, website.domain)

    if (website._id) {
      await db.collection('websites').updateOne({ _id: website._id }, { $set: { lastCheckId: id } })
    }

    const baseParams = { id, uri: website.domain, db, websiteId: website._id, quickcheckId, createdAt, type }

    const checks = [
      () => runHeaderCheck(baseParams),
      () => runSslCheck(baseParams),
      () => runCookieCheck(baseParams),
    ]

    if (type === 'full' || type === 'free') {
      checks.push(
        () => runFuzzCheck(baseParams),
        () => runDnsCheck(baseParams),
        () => runMixedContentCheck(baseParams),
        () => runPageAnalysisCheck(baseParams),
        () => runApiDocsCheck(baseParams),
      )
    }

    if (type === 'full') {
      checks.push(
        () => runCustomChecks(baseParams)
      )
    }

    let uptimeResult = await runUptimeCheck(baseParams)

    // Retry once if uptime check failed
    if (uptimeResult === 'fail') {
      console.log('Uptime check failed, retrying once...')
      await new Promise(resolve => setTimeout(resolve, 5000))
      uptimeResult = await runUptimeCheck(baseParams)
    }

    if (uptimeResult !== 'fail') {
      await Promise.all(checks.map(checkFn => checkFn()))
    }

    console.log('finished all checks')

    // don't run notifications if the job was triggered manually
    if (triggerName !== 'api-triggered-job') {
      await runNotifications({ db, website })
    }
  } catch (e) {
    console.error('unexpected error', e)
  }
}

export const runCustomFlow = async ({ flowId, id }) => {
  try {
    const db = await connectDB()

    const createdAt = new Date().toISOString()
    console.log(createdAt, `run custom flow for`, flowId)

    await runCustomChecks({ flowId, db, createdAt, id })

    console.log('finished custom flow')
  } catch (e) {
    console.error('unexpected error', e)
  }
}

export const runNotification = async ({ websiteId }) => {
  try {
    const db = await connectDB()
    const [website] = await db.collection('websites').find({ _id: new ObjectId(websiteId) }).toArray()

    console.log('running daily notifications for', website.domain)

    await runDailyNotification({ db, website })

    console.log('finished daily notifications for', website.domain)
  } catch (e) {
    console.error('unexpected error', e)
  }
}