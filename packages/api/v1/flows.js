import { ObjectId } from 'mongodb'
import fastifyPassport from '@fastify/passport';
import { connectDB } from '../db.js'
import { getJobStatus, runJob } from '../utils/worker.js'
import { hasActivePlan, getFlowLimit } from '../utils/user.js';

export default async function flowRoutes(fastify, opts) {
  fastify.get('/flows',
    { preValidation: fastifyPassport.authenticate('session', { failureRedirect: '/login' }) },
    async (request, reply) => {
      const user = request.user
      const { websiteId } = request.query
      if (!websiteId) {
        reply.code(400).send({ error: 'websiteId is required' });
        return;
      }

      const db = await connectDB();

      try {
        const website = await db.collection('websites').findOne({
          userId: user._id,
          deleted: { $ne: true },
          index: websiteId,
        })

        const flows = await db
          .collection('flows')
          .find({ websiteId: website._id.toString() })
          .toArray();

        // Get latest check result for each flow
        const flowResults = await Promise.all(flows.map(async (flow) => {
          const latestCheck = flow.lastCheckId ? await db.collection('checks').findOne({ jobId: flow.lastCheckId, flowId: flow._id.toString() }) : {};
          const status = flow.lastCheckId ? await getJobStatus(flow.lastCheckId) : {}
          
          return {
            ...flow,
            status,
            latestResult: {
              createdAt: latestCheck?.createdAt,
              ...(latestCheck?.result || {})
            }
          };
        }));

        return flowResults;
      } catch (e) {
        console.error(e);
        reply.code(500).send({ error: 'Internal server error' });
      }
    });

  fastify.post('/flows',
    { preValidation: [fastifyPassport.authenticate('session', { failureRedirect: '/login' }), hasActivePlan] },
    async (request, reply) => {
      const user = request.user
      const body = request.body

      // todo validate body

      const { websiteId, check } = body
      const { name, steps, notification } = check

      const db = await connectDB()

      try {
        const website = await db.collection('websites').findOne({
          userId: user._id,
          deleted: { $ne: true },
          _id: new ObjectId(websiteId),
        })

        if (!website) {
          reply.code(400).send({ error: 'Website not found' });
          return;
        }

        const allFlows = await db.collection('flows').find({ websiteId: websiteId }).toArray();
        const flowLimit = getFlowLimit(user)
        if (allFlows.length >= flowLimit) {
          reply.code(400).send({ error: `Maximum number of flows reached (${flowLimit})` });
          return;
        }

        const result = await db.collection('flows').insertOne({
          websiteId: websiteId,
          createdAt: new Date(),
          name,
          notification: notification || 'daily',
          steps,
        });

        const { message, waitingIndex, jobId } = await runJob({
          type: 'custom-flow',
          flowId: result.insertedId.toString()
        })

        await db.collection('flows').updateOne(
          { _id: result.insertedId },
          { $set: { lastCheckId: jobId } }
        )

        return { id: result.insertedId, message, waitingIndex, jobId };
      } catch (e) {
        console.error(e)
        reply.code(500).send({ error: 'Internal server error' });
      }
    })

  fastify.delete('/flows/:id',
    { preValidation: fastifyPassport.authenticate('session', { failureRedirect: '/login' }) },
    async (request, reply) => {
      const user = request.user
      const { id } = request.params

      const db = await connectDB()

      try {
        const flow = await db.collection('flows').findOne({ _id: new ObjectId(id) })
        if (!flow) {
          reply.code(404).send({ error: 'Flow not found' });
          return;
        }

        const website = await db.collection('websites').findOne({
          _id: new ObjectId(flow.websiteId),
          userId: user._id,
          deleted: { $ne: true },
        })

        if (!website) {
          reply.code(403).send({ error: 'Forbidden' });
          return;
        }

        await db.collection('flows').deleteOne({ _id: new ObjectId(id) })

        reply.code(204).send();
      } catch (e) {
        console.error(e)
        reply.code(500).send({ error: 'Internal server error' });
      }
    });

  fastify.put('/flows',
    { preValidation: fastifyPassport.authenticate('session', { failureRedirect: '/login' }) },
    async (request, reply) => {
      const user = request.user
      const body = request.body

      // todo validate body

      const { websiteId, check } = body
      const { name, steps, editId, notification } = check

      const db = await connectDB()

      try {
        const [website, flow] = await Promise.all([
          db.collection('websites').findOne({
            userId: user._id,
            deleted: { $ne: true },
            _id: new ObjectId(websiteId),
          }),
          db.collection('flows').findOne({ _id: new ObjectId(editId) })
        ])

        if (!website) {
          reply.code(400).send({ error: 'Website not found' });
          return;
        }

        if (!flow) {
          reply.code(404).send({ error: 'Flow not found' });
          return;
        }

        if (flow.websiteId !== websiteId) {
          reply.code(403).send({ error: 'Forbidden' });
          return;
        }

        await db.collection('flows').updateOne(
          { _id: new ObjectId(editId) },
          { $set: { name, steps, notification } }
        );

        return { id: editId };
      } catch (e) {
        console.error(e)
        reply.code(500).send({ error: 'Internal server error' });
      }
    });
}
