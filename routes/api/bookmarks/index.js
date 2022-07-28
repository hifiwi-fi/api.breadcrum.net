/* eslint-disable camelcase */
import SQL from '@nearform/sql'
import { createEpisode } from '../../../lib/create-episode.js'
import { runYTDLP } from '../../../lib/run-yt-dlp.js'

const commnonBookmarkProps = {
  url: { type: 'string', format: 'uri' },
  title: { type: 'string' },
  note: { type: 'string' },
  starred: { type: 'boolean' },
  toread: { type: 'boolean' },
  sensitive: { type: 'boolean' },
  tags: {
    type: ['array', 'null'],
    items: {
      type: 'string', minLength: 1, maxLength: 255
    }
  }
}

const fullBookmarkProps = {
  id: { type: 'string', format: 'uuid' },
  ...commnonBookmarkProps,
  created_at: { type: 'string', format: 'date-time' },
  updated_at: { type: 'string', format: 'date-time' },
  episodes: {
    type: ['array', 'null'],
    items: {
      type: 'object',
      properties: {
        episode_id: { type: 'string', format: 'uuid' },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' },
        url: { type: 'string', format: 'uri' },
        type: { enum: ['redirect'] },
        medium: { enum: ['video', 'audio'] },
        size_in_bytes: { type: 'integer' },
        duration_in_seconds: { type: 'integer' },
        mime_type: { type: 'string' },
        explicite: { type: 'boolean' },
        author_name: { type: 'string' },
        filename: { type: 'string' },
        ext: { type: 'string' },
        src_type: { type: 'string' },
        ready: { type: 'boolean' },
        error: { type: 'string' }
      }
    }
  }
}

const createEpisodeProp = {
  createEpisode: {
    anyOf: [
      {
        type: 'object',
        properties: {
          type: { enum: ['redirect'] },
          medium: { enum: ['video', 'audio'] }
        }
      },
      {
        type: 'null'
      }
    ]
  }
}

export default async function bookmarkRoutes (fastify, opts) {
  fastify.get(
    '/',
    {
      preHandler: fastify.auth([fastify.verifyJWT]),
      schema: {
        querystring: {
          type: 'object',
          properties: {
            before: {
              type: 'string',
              format: 'date-time'
            },
            after: {
              type: 'string',
              format: 'date-time'
            },
            per_page: {
              type: 'integer',
              minimum: 1,
              maximum: 200,
              default: 20
            },
            url: {
              type: 'string',
              format: 'uri'
            },
            tag: {
              type: 'string', minLength: 1, maxLength: 255
            },
            sensitive: {
              type: 'boolean',
              default: false
            }
          },
          dependencies: {
            before: { allOf: [{ not: { required: ['after', 'url'] } }] },
            after: { allOf: [{ not: { required: ['before', 'url'] } }] }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    ...fullBookmarkProps
                  }
                }
              },
              pagination: {
                type: 'object',
                properties: {
                  before: { type: 'string', format: 'date-time' },
                  after: { type: 'string', format: 'date-time' },
                  top: { type: 'boolean' },
                  bottom: { type: 'boolean' }
                }
              }
            }
          }
        }

      }
    },
    // Get Bookmarks
    async function getBookmarks (request, reply) {
      const id = request.user.id
      let {
        before,
        after,
        per_page: perPage,
        url,
        tag,
        sensitive
      } = request.query

      let top = false
      let bottom = false

      if (after) {
        // We have to fetch the first 2 rows because > is inclusive on timestamps (μS)
        // and we need to get the item before the next 'before' set.
        const perPageAfterOffset = perPage + 2
        const afterCalcQuery = SQL`
          with page as (
            select bm.id, bm.url, bm.title, bm.created_at
            from bookmarks bm
            ${tag
              ? SQL`
                left join bookmarks_tags bt
                on bm.id = bt.bookmark_id
                left join tags t
                on t.id = bt.tag_id`
              : SQL``}
            where bm.owner_id = ${id}
            and bm.created_at >= ${after}
            ${!sensitive ? SQL`AND bm.sensitive = false` : SQL``}
            ${tag
              ? SQL`
                and t.name = ${tag}
                and t.owner_id = ${id}`
              : SQL``}
            order by bm.created_at ASC, bm.title ASC, bm.url ASC
            fetch first ${perPageAfterOffset} rows only
          ),
          bookmark_with_last_row_date as (
            select last_value(page.created_at) over (
                  order by page.created_at
                  range between
                      UNBOUNDED PRECEDING AND
                      UNBOUNDED FOLLOWING
              ) last_created_at
            from page
          )
          select count(*)::int as bookmark_count, last_created_at
          from bookmark_with_last_row_date
          group by last_created_at`

        const results = await fastify.pg.query(afterCalcQuery)

        const { bookmark_count: bookmarkCount, last_created_at: lastCreatedAt } = results.rows.pop()

        if (bookmarkCount !== perPageAfterOffset) {
          top = true
          before = (new Date()).toISOString()
        } else {
          before = lastCreatedAt
        }
      }

      if (!before && !after) {
        top = true
        before = (new Date()).toISOString()
      }

      const getBookmarksQuery = SQL`
        with bookmark_page as (
          select bm.*
          from bookmarks bm
          ${tag
              ? SQL`
                left join bookmarks_tags bt
                on bm.id = bt.bookmark_id
                left join tags t
                on t.id = bt.tag_id`
              : SQL``}
          where bm.owner_id = ${id}
          ${before ? SQL`and bm.created_at < ${before}` : SQL``}
          ${url ? SQL`and url = ${url}` : SQL``}
          ${!sensitive ? SQL`and sensitive = false` : SQL``}
          ${tag ? SQL`and t.name = ${tag} and t.owner_id = ${id}` : SQL``}
          order by bm.created_at desc, bm.title desc, bm.url desc
          fetch first ${perPage} rows only
        ),
        bookark_page_tags_array as (
          select bm.id as bookmark_id, array_agg(t.name) as tag_array
          from bookmark_page bm
          left outer join bookmarks_tags bt
          on bm.id = bt.bookmark_id
          left outer join tags t
          on t.id = bt.tag_id
          where bm.owner_id = ${id}
          and t.owner_id = ${id}
          group by bm.id
        ),
        bookark_page_episodes_array as (
          select bm.id as bookmark_id, jsonb_strip_nulls(jsonb_agg(
            case
            when ep.id is null then null
            else jsonb_strip_nulls(jsonb_build_object(
              'episode_id', ep.id,
              'created_at', ep.created_at,
              'updated_at', ep.updated_at,
              'url', ep.url,
              'type', ep.type,
              'medium', ep.medium,
              'size_in_bytes', ep.size_in_bytes,
              'duration_in_seconds', ep.duration_in_seconds,
              'mime_type', ep.mime_type,
              'explicit', ep.explicit,
              'author_name', ep.author_name,
              'filename', ep.filename,
              'ext', ep.ext,
              'src_type', ep.src_type,
              'ready', ep.ready,
              'error', ep.error
            ))
            end)
          ) episodes
          from bookmark_page bm
          left outer join episodes ep
          on ep.bookmark_id = bm.id
          where bm.owner_id = ${id}
          and ep.owner_id = ${id}
          group by bm.id
        )
        select
          b.id,
          b.url,
          b.title,
          b.note,
          b.created_at,
          b.updated_at,
          b.toread,
          b.sensitive,
          b.starred,
          coalesce(array_to_json(tag_array), '[]'::json)::jsonb as tags,
          coalesce(episodes, '[]'::jsonb) as episodes
        from bookmark_page b
        left outer join bookark_page_tags_array
        on bookark_page_tags_array.bookmark_id = b.id
        left outer join bookark_page_episodes_array
        on bookark_page_episodes_array.bookmark_id = b.id
      `

      const results = await fastify.pg.query(getBookmarksQuery)

      if (results.rows.length !== perPage) bottom = true

      const nextPage = bottom ? null : results.rows.at(-1).created_at
      const prevPage = top ? null : results.rows[0]?.created_at || before

      return {
        data: results.rows,
        pagination: {
          before: nextPage,
          after: prevPage,
          top,
          bottom
        }
      }
    }
  )

  // Create bookmark
  fastify.put(
    '/',
    {
      preHandler: fastify.auth([fastify.verifyJWT]),
      schema: {
        body: {
          type: 'object',
          properties: {
            ...commnonBookmarkProps,
            ...createEpisodeProp
          },
          additionalProperties: false,
          required: ['url']
        },
        response: {
          201: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              site_url: { type: 'string' }
            }
          }
        }
      }
    },
    async function createBookmark (request, reply) {
      return fastify.pg.transact(async client => {
        const userId = request.user.id
        const {
          url,
          title,
          note,
          toread,
          sensitive,
          tags = []
        } = request.body

        const checkForExistingQuery = SQL`
        SELECT id, url
        FROM bookmarks
        WHERE owner_id = ${userId}
          AND url = ${url};
        `

        const existingResults = await client.query(checkForExistingQuery)
        const maybeResult = existingResults.rows[0]

        if (existingResults.rows.length > 0) {
          reply.redirect(301, `/api/bookmarks/${maybeResult.id}`)
          return {
            status: 'bookmark exists'
          }
        }

        const createBookmark = SQL`
        INSERT INTO bookmarks (url, title, note, toread, sensitive, owner_id) VALUES (
          ${url},
          ${title},
          ${note},
          ${toread || false},
          ${sensitive || false},
          ${userId}
        )
        RETURNING id, url, title, toread, sensitive, owner_id;`

        const results = await client.query(createBookmark)
        const bookmark = results.rows[0]

        if (tags.length > 0) {
          const createTags = SQL`
          INSERT INTO tags (name, owner_id)
          VALUES
             ${SQL.glue(
                tags.map(tag => SQL`(${tag},${userId})`),
                ' , '
              )}
          ON CONFLICT (name, owner_id)
          DO UPDATE
            SET name = EXCLUDED.name
          returning id, name, created_at, updated_at;
          `

          const tagsResults = await client.query(createTags)

          const applyTags = SQL`
          INSERT INTO bookmarks_tags (bookmark_id, tag_id)
          VALUES
            ${SQL.glue(
              tagsResults.rows.map(tag => SQL`(${bookmark.id},${tag.id})`),
              ' , '
            )};
          `

          await client.query(applyTags)
        }

        if (request?.body?.createEpisode) {
          const { id: episodeId } = await createEpisode({
            client,
            userId,
            bookmarkId: bookmark.id,
            type: request?.body?.createEpisode.type,
            medium: request?.body?.createEpisode.medium
          })

          await client.query('commit')

          fastify.pqueue.add(runYTDLP({
            userId,
            bookmarkId: bookmark.id,
            episodeId,
            pg: fastify.pg,
            log: request.log
          })).catch(request.log.error)
        }

        return {
          status: 'ok',
          site_url: `${fastify.config.TRANSPORT}://${fastify.config.HOST}/bookmarks/b?id=${bookmark.id}`
        }
      })
    }
  )

  fastify.get(
    '/:id', {
      preHandler: fastify.auth([fastify.verifyJWT]),
      schema: {
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' }
          },
          required: ['id']
        },
        response: {
          200: {
            type: 'object',
            properties: {
              ...fullBookmarkProps
            }
          }
        }
      }
    }, async function getBookmark (request, reply) {
      const userId = request.user.id
      const { id: bookmarkId } = request.params

      const query = SQL`
      SELECT id, url, title, note, created_at, updated_at, toread, sensitive, starred, t.tag_array as tags
        FROM bookmarks
        LEFT OUTER JOIN(
          SELECT bt.bookmark_id as id, jsonb_agg(t.name) as tag_array
          FROM bookmarks_tags bt
          JOIN tags t ON t.id = bt.tag_id
          GROUP BY bt.bookmark_id
        ) t using (id)
        WHERE owner_id = ${userId}
          AND id = ${bookmarkId}
        LIMIT 1;
      `

      const results = await fastify.pg.query(query)
      const bookmark = results.rows[0]
      if (!bookmark) {
        reply.code(404)
        return {
          status: 'bookmark id not found'
        }
      }
      return {
        ...bookmark
      }
    })

  fastify.put('/:id', {
    preHandler: fastify.auth([fastify.verifyJWT]),
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        },
        required: ['id']
      },
      body: {
        type: 'object',
        properties: {
          ...commnonBookmarkProps,
          ...createEpisodeProp
        },
        minProperties: 1,
        additionalProperties: false
      }
    }
  },
  async function updateBookmark (request, reply) {
    return fastify.pg.transact(async client => {
      const userId = request.user.id
      const bookmarkId = request.params.id
      const bookmark = request.body

      const updates = []

      if (bookmark.url != null) updates.push(SQL`url = ${bookmark.url}`)
      if (bookmark.title != null) updates.push(SQL`title = ${bookmark.title}`)
      if (bookmark.note != null) updates.push(SQL`note = ${bookmark.note}`)
      if (bookmark.starred != null) updates.push(SQL`starred = ${bookmark.starred}`)
      if (bookmark.toread != null) updates.push(SQL`toread = ${bookmark.toread}`)
      if (bookmark.sensitive != null) updates.push(SQL`sensitive = ${bookmark.sensitive}`)

      if (updates.length > 0) {
        const query = SQL`
          UPDATE bookmarks
          SET ${SQL.glue(updates, ' , ')}
          WHERE id = ${bookmarkId}
            AND owner_id =${userId};
          `

        await client.query(query)
      }

      if (Array.isArray(bookmark.tags)) {
        if (bookmark.tags.length > 0) {
          const createTags = SQL`
          INSERT INTO tags (name, owner_id)
          VALUES
             ${SQL.glue(
                bookmark.tags.map(tag => SQL`(${tag},${userId})`),
                ' , '
              )}
          ON CONFLICT (name, owner_id)
          DO UPDATE
            SET name = EXCLUDED.name
          returning id, name, created_at, updated_at;
          `

          const tagsResults = await client.query(createTags)

          const applyTags = SQL`
          INSERT INTO bookmarks_tags (bookmark_id, tag_id)
          VALUES
            ${SQL.glue(
              tagsResults.rows.map(tag => SQL`(${bookmarkId},${tag.id})`),
              ' , '
            )}
          ON CONFLICT (bookmark_id, tag_id)
          DO NOTHING;
          `

          await client.query(applyTags)

          const removeOldTags = SQL`
          DELETE FROM bookmarks_tags
          WHERE bookmark_id = ${bookmarkId}
            AND tag_id NOT IN (${SQL.glue(tagsResults.rows.map(tag => SQL`${tag.id}`), ', ')})
        `

          await client.query(removeOldTags)
        } else {
          const removeAllTags = SQL`
          DELETE FROM bookmarks_tags
          WHERE bookmark_id = ${bookmarkId}
        `

          await client.query(removeAllTags)
        }
      }

      if (bookmark?.createEpisode) {
        const { id: episodeId } = await createEpisode({
          client,
          userId,
          bookmarkId,
          type: bookmark.createEpisode.type,
          medium: bookmark.createEpisode.medium
        })

        await client.query('commit')

        fastify.pqueue.add(runYTDLP({
          userId,
          bookmarkId,
          episodeId,
          pg: fastify.pg,
          log: request.log
        })).catch(request.log.error)
      }

      return {
        status: 'ok'
      }
    })
  })

  fastify.delete('/:id', {
    preHandler: fastify.auth([fastify.verifyJWT]),
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        },
        required: ['id']
      }
    }
  },
  async function deleteBookmark (request, reply) {
    const userId = request.user.id
    const bookmarkId = request.params.id

    const query = SQL`
      DELETE from bookmarks
      WHERE id = ${bookmarkId}
        AND owner_id =${userId};
      `

    await fastify.pg.query(query)

    reply.status = 202
    return {
      status: 'ok'
    }
  })
}
