import fastifyPassport from '@fastify/passport';
import { v4 as uuidv4 } from 'uuid';
import { hashPassword, verifyPassword } from '../utils/password.js'
import { mapUser } from '../utils/user.js';
import { connectDB } from '../db.js';
import confirmChannel from '../utils/templates/confirmChannel.js';
import { getHtml, sendEmail } from '../utils/email.js';
import { sendVerification, checkVerification } from '../utils/bird.js';
import { ObjectId } from 'mongodb';

export default async function userRoutes(fastify, opts) {
  fastify.get('/',
    { preValidation: fastifyPassport.authenticate('session', { failureRedirect: '/login' }) },
    async (request, reply) => {
      try {
        const user = request.user

        return mapUser(user)
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

        const websites = await db.collection('websites').find({ userId: user._id }).toArray()
        for (const website of websites) {
          await db.collection('checks').deleteMany({ websiteId: website._id })
        }

        await Promise.all([
          db.collection('users').deleteOne({ _id: user._id }),
          db.collection('websites').deleteMany({ userId: user._id }),
          db.collection('flows').deleteMany({ userId: user._id })
        ])

        await request.logout();

        return { success: true }
      } catch (e) {
        console.error(e)
        reply.code(500).send({ error: 'Internal server error' });
      }
    })

  fastify.get('/registration', { config: { auth: false } }, async (request, reply) => {
    const disableRegistration = process.env.DISABLE_REGISTRATION === 'true' || process.env.DISABLE_REGISTRATION === true
    if (!disableRegistration) {
      return { adminRegistration: false }
    } else {
      const db = await connectDB()
      const userCount = await db.collection('users').countDocuments()

      if (userCount === 0) {
        return { adminRegistration: true }
      }

      return { adminRegistration: false }
    }
  })

  fastify.post('/notification-channel',
    { preValidation: fastifyPassport.authenticate('session', { failureRedirect: '/login' }) },
    async (request, reply) => {
      try {
        const { type, value } = request.body

        if (!type || !value) {
          return reply.code(400).send({ error: 'Invalid input' })
        }

        const user = request.user
        const db = await connectDB()

        const prevChannels = user.notificationChannels || []

        if (
          prevChannels.find(c => c.type === type && c.value === value) ||
          (type === 'email' && value === user.email)
        ) {
          return reply.code(409).send({ error: 'This channel already exists' })
        } else {
          let verificationToken = null
          let verified = false

          if (type === 'email') {
            verificationToken = uuidv4()
            const emailMjml = confirmChannel({ token: verificationToken })
            const emailHtml = getHtml(emailMjml)
            await sendEmail({
              to: value,
              subject: 'Confirm your new email notification channel',
              html: emailHtml
            })
          }

          if (type === 'sms') {
            const { id } = await sendVerification({ phonenumber: value })
            verificationToken = id
          }

          if (type === 'ntfy' || type === 'discord' || type === 'slack') {
            verified = true
          }

          const channelId = uuidv4()

          const updatedChannels = [...prevChannels, { id: channelId, type, value, verificationToken, verified }]

          await db.collection('users').updateOne({ _id: user._id }, {
            $set: { notificationChannels: updatedChannels }
          }, { returnDocument: 'after' })

          return { success: true }
        }
      } catch (e) {
        console.error(e)
        reply.code(500).send({ error: 'Internal server error' });
      }
    })

  fastify.delete('/notification-channel',
    { preValidation: fastifyPassport.authenticate('session', { failureRedirect: '/login' }) },
    async (request, reply) => {
      try {
        const { id } = request.query

        if (!id) {
          return reply.code(400).send({ error: 'Invalid input' })
        }

        const user = request.user
        const db = await connectDB()

        const prevChannels = user.notificationChannels || []

        const channelIndex = prevChannels.findIndex(c => c.id === id)

        if (channelIndex < 0) {
          return reply.code(404).send({ error: 'This channel does not exist' })
        } else {
          const updatedChannels = prevChannels.filter(c => c.id !== id)

          await db.collection('users').updateOne({ _id: user._id }, {
            $set: { notificationChannels: updatedChannels }
          }, { returnDocument: 'after' })

          return { success: true }
        }
      } catch (e) {
        console.error(e)
        reply.code(500).send({ error: 'Internal server error' });
      }
    })

  fastify.post('/verify-channel', { config: { auth: false } }, async (request, reply) => {
    try {
      const { token } = request.body

      if (!token) {
        return reply.code(400).send({ error: 'Invalid input' })
      }

      const db = await connectDB()
      const user = await db.collection('users').findOne({ 'notificationChannels.verificationToken': token })

      if (!user) {
        return reply.code(404).send({ error: 'This channel does not exist' })
      } else {
        const updatedChannels = (user.notificationChannels || []).map(c => {
          if (c.verificationToken === token) {
            return { ...c, verified: true, verificationToken: null }
          }
          return c
        })

        await db.collection('users').updateOne({ _id: user._id }, {
          $set: { notificationChannels: updatedChannels }
        }, { returnDocument: 'after' })

        return { success: true }
      }
    } catch (e) {
      console.error(e)
      reply.code(500).send({ error: 'Internal server error' });
    }
  })

  fastify.post('/verify-phone-number', { config: { auth: false } }, async (request, reply) => {
    try {
      const { number, code } = request.body

      if (!number || !code) {
        return reply.code(400).send({ error: 'Invalid input' })
      }

      const db = await connectDB()
      const user = await db.collection('users').findOne({
        'notificationChannels.value': number,
        'notificationChannels.type': 'sms',
        'notificationChannels.verified': false
      })

      if (!user) {
        return reply.code(404).send({ error: 'This channel does not exist' })
      } else {
        const verificationId = user.notificationChannels.find(c => c.value === number).verificationToken
        const result = await checkVerification({ verificationId, code })

        if (result?.status === 'verified') {
          const updatedChannels = (user.notificationChannels || []).map(c => {
            if (c.value === number) {
              return { ...c, verified: true, verificationToken: null }
            }
            return c
          })

          await db.collection('users').updateOne({ _id: user._id }, {
            $set: { notificationChannels: updatedChannels }
          }, { returnDocument: 'after' })

          return { success: true }
        } else {
          return { success: false, error: result?.message || 'Verification failed' }
        }
      }
    } catch (e) {
      console.error(e)
      reply.code(500).send({ error: 'Internal server error' });
    }
  })

  fastify.put('/password',
    { preValidation: fastifyPassport.authenticate('session', { failureRedirect: '/login' }) },
    async (request, reply) => {
      try {
        const { currentPassword, newPassword } = request.body

        // Validate input
        if (!currentPassword || !newPassword) {
          return reply.code(400).send({ error: 'Invalid input' })
        }

        const user = request.user

        const { match } = await verifyPassword(currentPassword, user.password)

        if (!match) {
          return reply.code(403).send({ error: 'Current password is incorrect' })
        } else {
          const db = await connectDB()
          const hashedNewPassword = await hashPassword(newPassword)
          await db.collection('users').updateOne({ _id: user._id }, {
            $set: { password: hashedNewPassword }
          }, { returnDocument: 'after' })

          return { success: true }
        }
      } catch (e) {
        console.error(e)
        reply.code(500).send({ error: 'Internal server error' });
      }
    })

  fastify.post('/unsubscribe', { config: { auth: false } }, async (request, reply) => {
    try {
      const { id } = request.body

      if (!id) {
        return reply.code(400).send({ error: 'Invalid input' })
      }

      const db = await connectDB()
      const user = await db.collection('users').findOne({ '_id': new ObjectId(id) })

      if (!user) {
        return reply.code(404).send({ error: 'This user does not exist' })
      } else {
        await db.collection('users').updateOne({ _id: user._id }, {
          $set: { unsubscribed: true }
        }, { returnDocument: 'after' })

        return { success: true }
      }
    } catch (e) {
      console.error(e)
      reply.code(500).send({ error: 'Internal server error' });
    }
  })
}
