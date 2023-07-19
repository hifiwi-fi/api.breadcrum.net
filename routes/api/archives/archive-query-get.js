import SQL from '@nearform/sql'

export function getArchivesQuery ({
  ownerId,
  archiveId,
  bookmarkId,
  before,
  sensitive,
  toread,
  starred,
  ready,
  perPage,
  fullArchives
}) {
  const archivesQuery = SQL`
    select
      ar.id,
      ar.created_at,
      ar.updated_at,
      ar.url,
      ar.title,
      coalesce (ar.title, bm.title) as display_title,
      ar.site_name,
      ${fullArchives ? SQL`ar.html_content,` : SQL``}
      ar.length,
      ar.excerpt,
      ar.byline,
      ar.direction,
      ar.language,
      ar.extraction_method,
      ar.ready,
      ar.error,
      jsonb_build_object(
        'id', bm.id,
        'url', bm.url,
        'title', bm.title,
        'note', bm.note,
        'created_at', bm.created_at,
        'updated_at', bm.updated_at,
        'starred', bm.starred,
        'toread', bm.toread,
        'sensitive', bm.sensitive
        /* tags? */
      ) as bookmark
    from archives ar
    join bookmarks bm
    on ar.bookmark_id = bm.id
    where ar.owner_id = ${ownerId}
    and bm.owner_id = ${ownerId}
    ${archiveId ? SQL`and ar.id = ${archiveId}` : SQL``}
    ${bookmarkId ? SQL`and ar.bookmark_id = ${bookmarkId}` : SQL``}
    ${before ? SQL`and ar.created_at < ${before}` : SQL``}
    ${!sensitive ? SQL`and sensitive = false` : SQL``}
    ${toread ? SQL`and toread = true` : SQL``}
    ${starred ? SQL`and starred = true` : SQL``}
    ${ready != null ? SQL`and ready = ${ready}` : SQL``}
    order by ar.created_at desc, ar.url desc, bm.title desc
    ${perPage != null ? SQL`fetch first ${perPage} rows only` : SQL``}
  `

  return archivesQuery
}

export function afterToBeforeArchivesQuery ({
  perPage,
  ownerId,
  bookmarkId,
  after,
  sensitive,
  toread,
  ready,
  starred
}) {
  const perPageAfterOffset = perPage + 2

  const needsJoin = !sensitive || toread || starred

  const afterCalcArchivesQuery = SQL`
    with page as (
      select ar.id, ar.created_at
      from archives ar
      ${needsJoin
          ? SQL`
              join bookmarks bm
              on ar.bookmark_id = bm.id`
          : SQL``}
      where ar.owner_id = ${ownerId}
      and ar.created_at >= ${after}
      ${ready != null ? SQL`and ready = ${ready}` : SQL``}
      ${bookmarkId
        ? SQL`ar.bookmark_id = ${bookmarkId}`
        : SQL``
      }
      ${needsJoin
        ? SQL`and bm.owner_id = ${ownerId}`
        : SQL``
      }
      ${!sensitive
        ? SQL`
          and bm.sensitive = false
        `
        : SQL``
      }
      ${toread
        ? SQL`
          and bm.toread = true
        `
        : SQL``
      }
      ${starred
        ? SQL`
          and bm.starred = true
        `
        : SQL``
      }
      order by ar.created_at ASC, ar.url ASC
      fetch first ${perPageAfterOffset} rows only
    ),
    archive_with_last_row_date as (
      select last_value(page.created_at) over (
        order by page.created_at
        range between
          UNBOUNDED PRECEDING AND
          UNBOUNDED FOLLOWING
      ) last_created_at
      from page
    )
    select count(*)::int as archive_count, last_created_at
    from archive_with_last_row_date
    group by last_created_at
  `

  return afterCalcArchivesQuery
}
