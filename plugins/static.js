import fp from 'fastify-plugin'
import path from 'path'
import desm from 'desm'

const __dirname = desm(import.meta.url)

/**
 * This plugins adds fastify-static
 *
 * @see https://github.com/fastify/fastify-static
 */
export default fp(async function (fastify, opts) {
  fastify.register(import('@fastify/static'), {
    root: path.join(__dirname, '../public'),
    prefix: '/',
    redirect: true,
    maxAge: 600000,
    lastModified: fastify.config.ENV !== 'production' // Always showing  Tue, 01 Jan 1980 00:00:01 GMT in prod for some reason
  })

  fastify.register(async function (fastify, opts) {
    fastify.addHook('preHandler', fastify.auth([
      fastify.verifyJWT,
      fastify.verifyAdmin
    ], {
      relation: 'and'
    }))
    fastify.register(import('@fastify/static'), {
      root: path.join(__dirname, '../public/admin'),
      prefix: '/',
      redirect: true,
      cacheControl: false,
      decorateReply: false,
      etag: false,
      lastModified: false
    })
  }, { prefix: '/admin' })
}, {
  name: 'static',
  dependencies: ['compress', 'auth', 'jwt']
})
