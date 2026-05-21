import fastifyPassport from '@fastify/passport';
import { v4 as uuidv4 } from 'uuid';
import { connectDB } from '../db.js'
import { hashPassword } from '../utils/password.js'
import { sendEmail, getHtml } from '../utils/email.js';
import confirmAccountTemplate from '../utils/templates/confirmAccount.js';
import resetPasswordTemplate from '../utils/templates/resetPassword.js';

export default async function authRoutes(fastify, opts) {
  fastify.post(
    '/login',
    {
      preValidation: fastifyPassport.authenticate('local', { failWithError: true }),
      config: { auth: false }
    },
    async (req, reply) => {
      return { message: 'Logged in' };
    }
  );

  fastify.post(
    '/register',
    { config: { auth: false } },
    async (req, reply) => {
      const db = await connectDB()

      const disableRegistration = process.env.DISABLE_REGISTRATION === 'true' || process.env.DISABLE_REGISTRATION === true

      if (disableRegistration) {
        const userCount = await db.collection('users').countDocuments()
        if (userCount > 0) {
          reply.code(403);
          return { error: 'Registration is disabled' };
        }
      }

      const { email, password } = req.body

      const existingUser = await db.collection('users').findOne({ email });
      if (existingUser) {
        reply.code(409);
        return { error: 'Email already registered' };
      }

      const passHash = await hashPassword(password)
      const token = uuidv4()
      const subscription = process.env.STRIPE_SECRET_KEY ? {
        plan: 'trial',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      } : { plan: 'pro' } // if no stripe key, give pro access directly (self-hosted)

      await db.collection('users').insertOne({
        email,
        password: passHash,
        confirmationToken: token,
        createdAt: new Date(),
        confirmed: disableRegistration ? true : false, // don't need to confirm admin if registration is disabled
        subscription,
      }, { returnDocument: 'after' })

      if (!disableRegistration) {
        const confirm_url = `${process.env.API_URL}/v1/confirm?token=${token}`
        const mjml = confirmAccountTemplate({ verificationLink: confirm_url })

        await sendEmail({
          to: email,
          subject: 'Please confirm your StatusScout account',
          html: getHtml(mjml)
        })
      }

      return { success: true };
    }
  );

  fastify.get('/confirm', { config: { auth: false } }, async (req, reply) => {
    const db = await connectDB()

    const { token } = req.query

    if (token) {
      await db.collection('users').updateOne({ confirmationToken: token }, { $set: { confirmed: true } });
    }

    reply.redirect(`${process.env.APP_URL}/onboarding`);
  });


  fastify.post(
    '/forgot-password',
    { config: { auth: false } },
    async (req, reply) => {
      const db = await connectDB()

      const { email } = req.body

      const existingUser = await db.collection('users').findOne({ email });
      if (!existingUser) {
        return { success: true };
      }

      const token = uuidv4()
      await db.collection('users').updateOne({ email }, {
        $set: {
          resetPasswordToken: token,
          resetPasswordExpires: new Date(Date.now() + 3600000) // 1 hour
        }
      }, { returnDocument: 'after' })

      const mjml = resetPasswordTemplate({ token: token })

      await sendEmail({
        to: email,
        subject: 'Reset Your Password',
        html: getHtml(mjml)
      })

      return { success: true };
    }
  );

  fastify.post(
    '/reset-password',
    { config: { auth: false } },
    async (req, reply) => {
      const db = await connectDB()

      const { token, password } = req.body

      const existingUser = await db.collection('users').findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: new Date() }
      });
      if (!existingUser) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // simulate delay to prevent brute force attacks
        reply.code(404);
        return { error: true };
      }

      const hashedPassword = await hashPassword(password)
      await db.collection('users').updateOne({ resetPasswordToken: token }, {
        $set: {
          password: hashedPassword,
          resetPasswordToken: null,
          resetPasswordExpires: null
        }
      }, { returnDocument: 'after' })

      return { success: true };
    }
  );

  fastify.get('/logout', { config: { auth: false } }, async (req, reply) => {
    await req.logout();
    return { message: 'Logged out' };
  });

  fastify.get('/authenticated',
    { preValidation: fastifyPassport.authenticate('session') },
    async (req, res) => {
      return { message: 'Authenticated' };
    }
  );
}
