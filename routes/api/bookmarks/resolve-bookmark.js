import SQL from '@nearform/sql'
import { putTagsQuery } from '../tags/put-tags-query.js'

export async function resolveBookmark ({
  fastify,
  pg,
  log,
  userId,
  bookmarkId,
  url,
  title,
  tags,
  summary,
  initialDocument
}) {
  pg = pg ?? fastify.pg
  log = log ?? fastify.log

  try {
    const metadata = await fastify.getSiteMetaData({
      url,
      initialDocument
    })

    log.info({ metadata, bookmarkId, url, title, tags, summary })

    const bookmarkData = []

    bookmarkData.push(SQL`done = true`)

    if (metadata?.title && title === url) bookmarkData.push(SQL`title = ${metadata?.title}`)
    if (metadata?.summary && !summary) bookmarkData.push(SQL`summary = ${metadata?.summary}`)
    log.info({ bookmarkData })
    const query = SQL`
        update bookmarks
        set ${SQL.glue(bookmarkData, ' , ')}
        where id = ${bookmarkId}
        and owner_id =${userId};
      `

    log.info({ query })

    const bookmarkResult = await pg.query(query)
    bookmarkResult.rows.pop()

    if (metadata?.tags?.length > 0 && !(tags?.length > 0)) {
      await putTagsQuery({
        fastify,
        pg,
        userId,
        bookmarkId,
        tags: metadata.tags
      })
    }

    log.info(`Bookmark ${bookmarkId} for ${url} is ready.`)
  } catch (err) {
    log.error(`Error resolving bookmark ${bookmarkId}`)
    log.error(err)
    const errorQuery = SQL`
        update bookmarks
        set error = ${err.stack}, done = true
        where id = ${bookmarkId}
        and owner_id =${bookmarkId};`
    log.error({ errorQuery })
    await pg.query(errorQuery)
  }
}
