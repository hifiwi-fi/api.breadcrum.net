import fp from 'fastify-plugin'
import nodemailer from 'nodemailer'

/**
 * This plugins adds nodemailer
 *
 * @see https://github.com/nodemailer/nodemailer
 */
export default fp(async function (fastify, opts) {
  if (fastify.config.SMTP_HOST && fastify.config.SMTP_PORT && fastify.config.SMTP_SECURE && fastify.config.SMTP_USER && fastify.config.SMTP_PASS) {
    const transport = nodemailer.createTransport({
      host: fastify.config.SMTP_HOST,
      port: fastify.config.SMTP_PORT,
      secure: fastify.config.SMTP_SECURE,
      auth: {
        user: fastify.config.SMTP_USER,
        pass: fastify.config.SMTP_PASS
      }
    })

    fastify.decorate('email', transport)
  }
}, {
  name: 'email',
  dependencies: ['env']
})
