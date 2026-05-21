import fastifyPassport from '@fastify/passport';
import { ObjectId } from 'mongodb'
import { connectDB } from '../db.js'
import { hasActivePlan, getWebsiteLimit } from '../utils/user.js';

export default async function userRoutes(fastify, opts) {
  fastify.post('/',
    { preValidation: [fastifyPassport.authenticate('session', { failureRedirect: '/login' }), hasActivePlan] },
    async (request, reply) => {
      const user = request.user
      const body = request.body || {}
      const url = new URL(body.url);
      const baseUrl = url.origin;

      const db = await connectDB()
      const existingWebsite = await db.collection('websites').findOne({ userId: user._id, domain: baseUrl, deleted: { $ne: true } })

      if (existingWebsite) {
        reply.code(400).send({ error: 'A website with this domain already exists' });
        return;
      }

      const allWebsites = await db.collection('websites').find({ userId: user._id, deleted: { $ne: true } }).toArray()
      const limit = getWebsiteLimit(user)
      if (allWebsites.length >= limit) {
        reply.code(403).send({ error: `Website limit reached (${limit}). Please delete an existing website or upgrade your plan.` });
        return;
      }

      const count = await db.collection('websites').countDocuments({ userId: user._id })
      const newElemIndex = (count + 1).toString()
      const result = await db.collection('websites').insertOne({
        userId: user._id,
        domain: baseUrl,
        createdAt: new Date(),
        index: newElemIndex,
        dailyChannel: 'email',
        criticalChannel: 'email'
      })

      return { id: result.insertedId, index: newElemIndex }
    })

  fastify.get('/',
    { preValidation: fastifyPassport.authenticate('session', { failureRedirect: '/login' }) },
    async (request, reply) => {
      try {
        const user = request.user

        const db = await connectDB()
        const websites = await db.collection('websites').find({ userId: user._id, deleted: { $ne: true } }).toArray()
        const websiteIds = websites.map(w => w._id)
        const recentChecks = await db.collection('checks').aggregate([
          { $match: { websiteId: { $in: websiteIds } } },
          { $sort: { createdAt: -1 } },
          {
            $group: {
              _id: "$websiteId",
              recentCheck: { $first: "$$ROOT" }
            }
          },
          { $replaceRoot: { newRoot: "$recentCheck" } }
        ]).toArray()

        return websites.map(w => ({
          id: w._id.toString(),
          domain: w.domain,
          createdAt: w.createdAt,
          index: w.index,
          recentCheck: recentChecks.find(c => c.websiteId.toString() === w._id.toString())?.createdAt,
          dailyChannel: w.dailyChannel || 'disabled',
          criticalChannel: w.criticalChannel || 'disabled',
          notifications: w.notifications || {},
          publicReport: w.publicReport || false,
        }))
      } catch (e) {
        console.error(e)
        reply.code(500).send({ error: 'Internal server error' });
      }
    })


  fastify.delete('/',
    { preValidation: fastifyPassport.authenticate('session', { failureRedirect: '/login' }) },
    async (request, reply) => {
      try {
        const user = request.user

        const db = await connectDB()
        const query = request.query || {}
        const websiteId = query.id
        await db.collection('websites').updateOne({ _id: new ObjectId(websiteId), userId: user._id }, { $set: { deleted: true } })

        return { success: true }
      } catch (e) {
        console.error(e)
        reply.code(500).send({ error: 'Internal server error' });
      }
    })

  fastify.put('/notification-channel',
    { preValidation: fastifyPassport.authenticate('session', { failureRedirect: '/login' }) },
    async (request, reply) => {
      try {
        const user = request.user
        const body = request.body || {}

        const db = await connectDB()
        if (body.type === 'dailyChannel') {
          await db.collection('websites').updateOne(
            { _id: new ObjectId(body.websiteId), userId: user._id },
            { $set: { dailyChannel: body.channel } }
          )
        } else if (body.type === 'criticalChannel') {
          await db.collection('websites').updateOne(
            { _id: new ObjectId(body.websiteId), userId: user._id },
            { $set: { criticalChannel: body.channel } }
          )
        }

        return { success: true }
      } catch (e) {
        console.error(e)
        reply.code(500).send({ error: 'Internal server error' });
      }
    })

  fastify.put('/notifications',
    { preValidation: fastifyPassport.authenticate('session', { failureRedirect: '/login' }) },
    async (request, reply) => {
      try {
        const user = request.user
        const body = request.body || {}

        const db = await connectDB()
        const prevWebsite = await db.collection('websites').findOne({ _id: new ObjectId(body.websiteId), userId: user._id })
        if (!prevWebsite) {
          reply.code(404).send({ error: 'Website not found' });
          return;
        }

        const prios = prevWebsite.notifications || {}
        prios[body.check] = body.value

        await db.collection('websites').updateOne(
          { _id: new ObjectId(body.websiteId), userId: user._id },
          { $set: { notifications: prios } }
        )

        return { success: true }
      } catch (e) {
        console.error(e)
        reply.code(500).send({ error: 'Internal server error' });
      }
    })

  fastify.get('/uptime',
    { preValidation: fastifyPassport.authenticate('session', { failureRedirect: '/login' }) },
    async (request, reply) => {
      try {
        const user = request.user
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const thirtyDaysAgoIso = thirtyDaysAgo.toISOString();

        const db = await connectDB()

        const websites = await db.collection('websites').find({ userId: user._id, deleted: { $ne: true } }).toArray()
        const websiteIds = websites.map(w => w._id)

        const [count, failedCount, [oldestCheck]] = await Promise.all([
          db.collection('checks').countDocuments({
            websiteId: { $in: websiteIds },
            check: 'uptime',
            createdAt: { $gte: thirtyDaysAgoIso }
          }),
          db.collection('checks').countDocuments({
            websiteId: { $in: websiteIds },
            check: 'uptime',
            'result.status': 'fail',
            createdAt: { $gte: thirtyDaysAgoIso }
          }),
          db.collection('checks')
            .find({
              websiteId: { $in: websiteIds },
              check: 'uptime',
              createdAt: { $gte: thirtyDaysAgoIso }
            })
            .sort({ createdAt: 1 })
            .limit(1)
            .toArray()
        ])

        const dateDiff = oldestCheck?.createdAt
          ? Math.ceil((new Date() - new Date(oldestCheck.createdAt)) / (1000 * 60 * 60 * 24))
          : null;

        return { count, failedCount, dateDiff }
      } catch (e) {
        console.error(e)
        reply.code(500).send({ error: 'Internal server error' });
      }
    })

  fastify.put('/public-report',
    { preValidation: fastifyPassport.authenticate('session', { failureRedirect: '/login' }) },
    async (request, reply) => {
      try {
        const user = request.user
        const body = request.body || {}

        const db = await connectDB()
        const website = await db.collection('websites').findOne({ _id: new ObjectId(body.websiteId), userId: user._id })
        if (!website) {
          reply.code(404).send({ error: 'Website not found' })
          return
        }

        const newValue = !website.publicReport
        await db.collection('websites').updateOne(
          { _id: new ObjectId(body.websiteId), userId: user._id },
          { $set: { publicReport: newValue } }
        )

        return { publicReport: newValue }
      } catch (e) {
        console.error(e)
        reply.code(500).send({ error: 'Internal server error' })
      }
    })

  // fastify.post('/ignore',
  //   { preValidation: fastifyPassport.authenticate('session', { failureRedirect: '/login' }) },
  //   async (request, reply) => {
  //     const body = request.body
  //     // request.user

  //     const db = await connectDB()

  //     try {
  //       if (body.action === 'add') {
  //         await db.collection('users').updateOne(
  //           { _id: new ObjectId(process.env.TMP_USER_ID) },
  //           { $addToSet: { ignore: { item: body.item, type: body.type } } }
  //         )
  //       } else if (body.action === 'remove') {
  //         await db.collection('users').updateOne(
  //           { _id: new ObjectId(process.env.TMP_USER_ID) },
  //           { $pull: { ignore: { item: body.item, type: body.type } } }
  //         )
  //       }

  //       return {}
  //     } catch (e) {
  //       console.error(e)
  //       reply.code(500).send({ error: 'Internal server error' });
  //     }

  //     return {}
  //   })
}
