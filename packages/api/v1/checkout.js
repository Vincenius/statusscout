import Stripe from 'stripe';
import { connectDB } from '../db.js';
import { ObjectId } from 'mongodb';
import fastifyPassport from '@fastify/passport';

const stripe = Stripe(process.env.STRIPE_SECRET_KEY || 'no-key')
const monthlyPrice = process.env.STRIPE_MONTHLY_PRICE_ID
const yearlyPrice = process.env.STRIPE_YEARLY_PRICE_ID
const agencyMonthlyPrice = process.env.STRIPE_AGENCY_MONTHLY_PRICE_ID
const agencyYearlyPrice = process.env.STRIPE_AGENCY_YEARLY_PRICE_ID

function getPriceId(type) {
  if (type === 'agency-yearly') return agencyYearlyPrice;
  if (type === 'agency-monthly') return agencyMonthlyPrice;
  if (type === 'base-yearly') return yearlyPrice;
  return monthlyPrice; // base-monthly default
}

function getPlanTier(type) {
  return type?.startsWith('agency') ? 'agency' : 'pro';
}

export default async function checkoutRoutes(fastify, opts) {
  // Webhook must use a raw body for signature verification, so it lives in its
  // own encapsulated sub-plugin that overrides the JSON content-type parser.
  fastify.register(async function webhookPlugin(fastify) {
    fastify.addContentTypeParser('application/json', { parseAs: 'buffer' }, (req, body, done) => {
      done(null, body)
    })

    fastify.post('/webhook', { config: { auth: false } }, async (request, reply) => {
      if (!process.env.STRIPE_SECRET_KEY) {
        reply.status(500).send({ error: 'Stripe secret key not configured' })
        return
      }

      const sig = request.headers['stripe-signature']
      let event
      try {
        event = stripe.webhooks.constructEvent(request.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
      } catch (err) {
        reply.status(400).send({ error: `Webhook signature verification failed: ${err.message}` })
        return
      }

      const db = await connectDB()

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object
        if (session.mode === 'subscription' && session.client_reference_id) {
          const plan = session.metadata?.plan || 'pro'
          await db.collection('users').updateOne(
            { _id: new ObjectId(session.client_reference_id) },
            { $set: { subscription: { plan, expiresAt: null, id: session.subscription } } }
          )
        }
      } else if (event.type === 'invoice.payment_failed') {
        const invoice = event.data.object
        if (invoice.subscription) {
          await db.collection('users').updateOne(
            { 'subscription.id': invoice.subscription },
            { $set: { 'subscription.expiresAt': new Date() } }
          )
        }
      } else if (event.type === 'customer.subscription.deleted') {
        const subscription = event.data.object
        await db.collection('users').updateOne(
          { 'subscription.id': subscription.id },
          { $set: { 'subscription.expiresAt': new Date() } }
        )
      }

      return { received: true }
    })
  })

  fastify.post('/session', { preValidation: fastifyPassport.authenticate('session', { failureRedirect: '/login' }) }, async (request, reply) => {
    if (!process.env.STRIPE_SECRET_KEY) {
      reply.status(500).send({ error: 'Stripe secret key not configured' })
      return
    }

    const { _id, email } = request.user || {}
    const { type, colorScheme } = request.body
    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded',
      client_reference_id: _id.toString(),
      customer_email: email,
      metadata: { plan: getPlanTier(type) },
      line_items: [
        {
          price: getPriceId(type),
          quantity: 1,
        },
      ],
      branding_settings: colorScheme === 'dark' ? {
        background_color: '#242424',
      } : {},
      mode: 'subscription',
      return_url: `${process.env.APP_URL}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
    });

    return { clientSecret: session.client_secret, id: session.id }
  })

  fastify.post('/return', { config: { auth: false } }, async (request, reply) => {
    if (!process.env.STRIPE_SECRET_KEY) {
      reply.status(500).send({ error: 'Stripe secret key not configured' })
      return
    }

    const { session_id } = request.body
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.status === 'complete') {
      const db = await connectDB()
      const plan = session.metadata?.plan || 'pro';
      await db.collection('users').updateOne(
        { _id: new ObjectId(session.client_reference_id) },
        {
          $set: {
            subscription: {
              plan,
              expiresAt: null,
              id: session.subscription
            }
          }
        }
      )

      return { success: true }
    } else {
      reply.status(400).send({ error: 'Payment not completed' })
      return
    }
  })

  fastify.post('/cancel', { preValidation: fastifyPassport.authenticate('session', { failureRedirect: '/login' }) }, async (request, reply) => {
    if (!process.env.STRIPE_SECRET_KEY) {
      reply.status(500).send({ error: 'Stripe secret key not configured' })
      return
    }
    const { user } = request
    const { type } = request.body

    if (!user?.subscription?.id) {
      reply.status(400).send({ error: 'No active subscription' })
      return
    }

    if (type === 'cancel') {
      const result = await stripe.subscriptions.update(
        user?.subscription?.id,
        { cancel_at_period_end: true }
      );

      const db = await connectDB()
      await db.collection('users').updateOne(
        { _id: user._id },
        {
          $set: {
            subscription: {
              ...user.subscription,
              expiresAt: new Date(result.cancel_at * 1000),
            }
          }
        }
      )
    } else if (type === 'revert-cancel') {
      await stripe.subscriptions.update(
        user?.subscription?.id,
        { cancel_at_period_end: false }
      );

      const db = await connectDB()
      await db.collection('users').updateOne(
        { _id: user._id },
        {
          $set: {
            subscription: {
              ...user.subscription,
              expiresAt: null,
            }
          }
        }
      )
    }

    return { success: true }
  })
}
