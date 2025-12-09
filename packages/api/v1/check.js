import fastifyPassport from '@fastify/passport';
import { v4 as uuidv4 } from 'uuid';
import { connectDB } from '../db.js'
import { ObjectId } from 'mongodb';
import { getJobStatus, runJob } from '../utils/worker.js'
import { hasActivePlan } from '../utils/user.js';

export default async function checkRoutes(fastify, opts) {
  fastify.post('/statuscheck',
    { preValidation: fastifyPassport.authenticate('session', { failureRedirect: '/login' }) },
    async (request, reply) => {
      const body = request.body || {}
      const url = new URL(body.url);
      const baseUrl = url.origin;
      const statusCode = await fetch(baseUrl, { method: 'GET' })
        .then(response => response.status)
        .catch(() => 500);

      return { statusCode }
    })

  fastify.post('/check',
    { preValidation: [fastifyPassport.authenticate('session', { failureRedirect: '/login' }), hasActivePlan] },
    async (request, reply) => {
      const body = request.body || {}
      const websiteId = body.id
      const userId = request.user?._id

      const db = await connectDB()
      const website = await db.collection('websites').findOne({ _id: new ObjectId(websiteId), userId })

      if (website) {
        const { message, waitingIndex, jobId } = await runJob({ websiteId, type: 'full' })

        return { message, waitingIndex, jobId }
      } else {
        // return 404 error
        reply.code(404).send({ error: 'Not Found' })
      }
    })

  fastify.get('/check',
    { preValidation: fastifyPassport.authenticate('session', { failureRedirect: '/login' }) },
    async (request, reply) => {
      const query = request.query || {}
      const websiteId = query.id
      const jobId = query.jobId
      const userId = request.user?._id

      const db = await connectDB()
      const website = await db.collection('websites').findOne({ index: websiteId, userId })

      if (website) {
        const status = await getJobStatus(jobId || website.lastCheckId)
        const checks = jobId
          ? await db.collection('checks').find({ websiteId: website._id, jobId: jobId }).toArray()
          : await db.collection('checks').aggregate([
            { $match: { websiteId: website._id } },
            { $sort: { check: 1, createdAt: -1 } },
            {
              $group: {
                _id: "$check",
                entries: { $push: "$$ROOT" }
              }
            },
            {
              $project: {
                _id: 0,
                check: "$_id",
                entries: { $slice: ["$entries", 1] }
              }
            },
            { $unwind: "$entries" },
            { $replaceRoot: { newRoot: "$entries" } }
          ]).toArray()

        return { checks, status };
      } else {
        // return 404 error
        reply.code(404).send({ error: 'Not Found' })
      }
    })

  fastify.post('/quickcheck', { config: { auth: false } }, async (request, reply) => {
    const body = request.body || {}

    const verification = process.env.TURNSTILE_SECRET_KEY
      ? await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          secret: process.env.TURNSTILE_SECRET_KEY,
          response: body.turnstileToken,
        })
      }).then(res => res.json())
      : { success: true };

    if (!verification.success) {
      return reply.code(400).send({ error: 'Captcha verification failed' });
    }

    const url = new URL(body.url);
    const baseUrl = url.origin;
    const statusCode = await fetch(baseUrl, { method: 'GET' })
      .then(response => response.status)
      .catch(() => 500);

    if (statusCode === 200) {
      const db = await connectDB()

      try {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0)

        const prevChecks = []
        // later todo: limit amount of free quickchecks per day
        // const prevChecks = userId
        //   ? null // ignore prev checks if user is logged in
        //   : await db.collection('quickchecks')
        //     .find({ url: baseUrl, createdAt: { $gte: startOfToday } })
        //     .sort({ createdAt: -1 })
        //     .limit(3).toArray();

        if (prevChecks && prevChecks.length >= 3) {
          // return prev check if it was already checked three times today
          return { statusCode, quickcheckId: prevChecks[0].quickcheckId, isPrevCheck: true }
        } else {
          const quickcheckId = uuidv4();
          const { waitingIndex, jobId } = await runJob({ type: 'free', quickcheckId, url: baseUrl })
          await db.collection('quickchecks').insertOne({ url: baseUrl, createdAt: new Date(), quickcheckId, jobId })

          return { statusCode, quickcheckId, waitingIndex }
        }
      } catch (e) {
        console.error(e)
        reply.code(500).send({ error: 'Internal server error' });
      }
    } else {
      return { statusCode }
    }
  })

  fastify.get('/quickcheck', { config: { auth: false } }, async (request, reply) => {
    const { id } = request.query;

    if (!id) {
      return { error: true, message: 'Missing Id' }
    }

    try {
      const db = await connectDB()

      const [[quickcheck], checks] = await Promise.all([
        await db.collection('quickchecks').find({ quickcheckId: id }).toArray(),
        await db.collection('checks').find({ quickcheckId: id }).toArray()
      ])

      if (!quickcheck) {
        return { error: true, message: 'Quickcheck not found' }
      }

      const { waitingIndex, state } = await getJobStatus(quickcheck.jobId)

      return {
        statusCode: 200,
        quickcheckId: id,
        checks,
        waitingIndex,
        state,
        url: quickcheck.url,
        createdAt: quickcheck.createdAt.toISOString(),
      }
    } catch (e) {
      console.error(e)
      reply.code(500).send({ error: 'Internal server error' });
    }
  })

  fastify.get('/history', { config: { auth: false } }, async (request, reply) => {
    const { id } = request.query;

    if (!id) {
      return {}
    }

    const db = await connectDB()

    const [uptime, checks, firstCheck] = await Promise.all([
      db.collection('checks').find({ websiteId: new ObjectId(id), check: 'uptime' })
        .sort({ createdAt: -1 })
        .limit(41)
        .toArray(),
      db.collection('checks').aggregate([
        { $match: { websiteId: new ObjectId(id), check: { $ne: 'uptime' } } },
        { $sort: { check: 1, createdAt: -1 } },
        {
          $group: {
            _id: "$check",
            entries: { $push: "$$ROOT" }
          }
        },
        {
          $project: {
            _id: 0,
            check: "$_id",
            entries: { $slice: ["$entries", 41] }
          }
        },
        { $unwind: "$entries" },
        { $replaceRoot: { newRoot: "$entries" } }
      ]).toArray(),
      db.collection('checks').find({ websiteId: new ObjectId(id) })
        .sort({ createdAt: 1 })
        .limit(1)
        .toArray(),
    ])

    return { uptime, checks, initialCheckDate: firstCheck[0]?.createdAt }
  })
}
