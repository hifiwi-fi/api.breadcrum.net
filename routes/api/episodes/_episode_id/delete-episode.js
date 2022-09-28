/* eslint-disable camelcase */
import SQL from '@nearform/sql'

export async function deleteEpisode (fastify, opts) {
  fastify.delete('/', {
    preHandler: fastify.auth([fastify.verifyJWT]),
    schema: {
      params: {
        type: 'object',
        properties: {
          episode_id: { type: 'string', format: 'uuid' }
        },
        required: ['episode_id']
      }
    }
  },
  async function deleteEpisodeHandler (request, reply) {
    const ownerID = request.user.id
    const episodeID = request.params.episode_id

    const query = SQL`
      delete from episodes
      where id = ${episodeID}
        and owner_id = ${ownerID}
    `

    // TODO: check results
    await fastify.pg.query(query)

    reply.status = 202
    fastify.metrics.episodeDeleteCounter.inc()

    return {
      status: 'ok'
    }
  })
}
