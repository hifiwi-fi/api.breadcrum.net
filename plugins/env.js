import fp from 'fastify-plugin'

export const schema = {
  type: 'object',
  required: [
    'JWT_SECRET',
    'COOKIE_SECRET'
  ],
  properties: {
    ENV: {
      type: 'string',
      default: 'development'
    },
    METRICS: {
      type: 'integer', // 0 or 1
      default: 1
    },
    JWT_SECRET: {
      type: 'string'
    },
    COOKIE_SECRET: {
      type: 'string'
    },
    COOKIE_NAME: {
      type: 'string',
      default: 'breadcrum_token'
    },
    DATABASE_URL: {
      type: 'string',
      default: 'postgres://postgres@localhost/breadcrum'
    },
    REDIS_URL: {
      type: 'string',
      default: 'redis://localhost:6379/1'
    },
    HOST: {
      // Hostname and port (if needed)
      type: 'string',
      default: 'localhost:3000'
    },
    TRANSPORT: {
      enum: ['http', 'https'],
      default: 'http'
    },
    PQUEUE_CONCURRENCY: {
      type: 'integer',
      default: 1
    },
    PQUEUE_TIMEOUT: {
      type: 'integer',
      default: 60000
    }
  }
}

/**
 * This plugins adds config
 *
 * @see https://github.com/fastify/fastify-env
 */
export default fp(async function (fastify, opts) {
  fastify.register(import('@fastify/env'), {
    schema,
    dotenv: true
  })
}, {
  name: 'env'
})
