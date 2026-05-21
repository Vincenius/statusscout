import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import middie from '@fastify/middie';
import fastifySecureSession from '@fastify/secure-session';
import { Strategy as LocalStrategy } from 'passport-local';
import fastifyPassport from '@fastify/passport';
import { ObjectId } from 'mongodb';
import { disconnectDB, connectDB } from './db.js'
import { verifyPassword } from './utils/password.js'

import authRoutes from './v1/auth.js'
import flowsRoutes from './v1/flows.js'
import websiteRoutes from './v1/website.js'
import checkRoutes from './v1/check.js'
import feedbackRoutes from './v1/feedback.js';
import userRoutes from './v1/user.js';
import notificationRoutes from './v1/notification.js';
import checkoutRoutes from './v1/checkout.js';

const fastify = Fastify({
  logger: false,
})

await fastify.register(middie)

await fastify.register(cors, {
  origin: [process.env.FRONTEND_URL, process.env.APP_URL].filter(Boolean),
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
})

await fastify.register(fastifySecureSession, {
  secret: process.env.SESSION_SECRET,
  cookie: {
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  }
})

// Register passport
await fastify.register(fastifyPassport.initialize());
await fastify.register(fastifyPassport.secureSession());

// Local strategy
fastifyPassport.use(
  'local',
  new LocalStrategy({ usernameField: 'email', passwordField: 'password' },
    async (email, password, done) => {
      try {
        const db = await connectDB();
        const user = await db.collection('users').findOne({ email });
        if (!user) {
          return done(null, false, { message: 'Invalid login' });
        }

        const { match, migratedHash } = await verifyPassword(password, user.password)

        if (!match) {
          return done(null, false, { message: 'Invalid login' });
        }

        if (migratedHash) {
          // Transparently migrate legacy hash to bcrypt on first login
          await db.collection('users').updateOne({ _id: user._id }, { $set: { password: migratedHash } });
          return done(null, { ...user, password: migratedHash });
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
);

// Serialize
fastifyPassport.registerUserSerializer(async (user) => {
  return { id: user._id };
});

// Deserialize
fastifyPassport.registerUserDeserializer(async (user) => {
  try {
    const db = await connectDB();
    const dbUser = await db.collection('users').findOne({ _id: new ObjectId(user.id) });
    if (!dbUser) return null;
    return dbUser;
  } catch (err) {
    return null;
  }
});

fastify.addHook('preHandler', async (request, reply) => {
  const routeAuthDisabled =
    request.routeOptions?.config?.auth === false;

  if (routeAuthDisabled) {
    return; // skip auth check
  }

  if (!request.isAuthenticated()) {
    reply.code(401).send({ error: 'Unauthorized' });
  }
});

fastify.register(authRoutes, { prefix: '/v1' })
fastify.register(flowsRoutes, { prefix: '/v1' })
fastify.register(websiteRoutes, { prefix: '/v1/website' })
fastify.register(userRoutes, { prefix: '/v1/user' })
fastify.register(checkRoutes, { prefix: '/v1' })
fastify.register(checkoutRoutes, { prefix: '/v1/checkout' })

fastify.register(feedbackRoutes, { prefix: '/v1/feedback' })
fastify.register(notificationRoutes, { prefix: '/v1/notification' })

fastify.addHook('onClose', async (instance, done) => {
  console.log('Close db connection');
  await disconnectDB();
  done();
});


try {
  console.log('Starting server on port 4000');
  await fastify.listen({ port: 4000, host: '0.0.0.0' })
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}