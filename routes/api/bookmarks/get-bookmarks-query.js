import SQL from '@nearform/sql'

export const getBookmarksQuery = ({
  tag,
  ownerId,
  bookmarkId,
  before,
  url,
  sensitive,
  starred,
  toread,
  perPage,
  fullArchives
}) => {
  const bookarmsQuery = SQL`
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
          where bm.owner_id = ${ownerId}
          ${bookmarkId ? SQL`and bm.id = ${bookmarkId}` : SQL``}
          ${before ? SQL`and bm.created_at < ${before}` : SQL``}
          ${url ? SQL`and url = ${url}` : SQL``}
          ${!sensitive ? SQL`and sensitive = false` : SQL``}
          ${starred ? SQL`and starred = true` : SQL``}
          ${toread ? SQL`and toread = true` : SQL``}
          ${tag ? SQL`and t.name = ${tag} and t.owner_id = ${ownerId}` : SQL``}
          order by bm.created_at desc, bm.title desc, bm.url desc
          ${perPage != null ? SQL`fetch first ${perPage} rows only` : SQL``}
        ),
        bookark_page_tags_array as (
          select bm.id as bookmark_id, array_agg(t.name) as tag_array
          from bookmark_page bm
          left outer join bookmarks_tags bt
          on bm.id = bt.bookmark_id
          left outer join tags t
          on t.id = bt.tag_id
          where bm.owner_id = ${ownerId}
          and t.owner_id = ${ownerId}
          group by bm.id
        ),
        bookark_page_episodes_array as (
          select bm.id as bookmark_id, jsonb_strip_nulls(jsonb_agg(
            case
            when ep.id is null then null
            else jsonb_strip_nulls(jsonb_build_object(
              'id', ep.id,
              'podcast_feed_id', ep.podcast_feed_id,
              'created_at', ep.created_at,
              'updated_at', ep.updated_at,
              'url', ep.url,
              'title', ep.title,
              'display_title', coalesce(ep.title, bm.title),
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
          where bm.owner_id = ${ownerId}
          and ep.owner_id = ${ownerId}
          group by bm.id
        ),
        archives_array as (
          select bm.id as bookmark_id, jsonb_strip_nulls(jsonb_agg(
            case
            when ar.id is null then null
            else jsonb_strip_nulls(jsonb_build_object(
              'id', ar.id,
              'created_at', ar.created_at,
              'updated_at', ar.updated_at,
              'url', ar.url,
              'title', ar.title,
              'site_name', ar.site_name,
              'length', ar.length,
              ${fullArchives ? SQL`'html_content', ar.html_content,` : SQL``}
              'excerpt', ar.excerpt,
              'byline', ar.byline,
              'direction', ar.direction,
              'language', ar.language,
              'ready', ar.ready,
              'error', ar.error
            ))
            end)
          ) archives
          from bookmark_page bm
          left outer join archives ar
          on ar.bookmark_id = bm.id
          where bm.owner_id = ${ownerId}
          and ar.owner_id = ${ownerId}
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
          coalesce(episodes, '[]'::jsonb) as episodes,
          coalesce(archives, '[]'::jsonb) as archives,
          b.archive_urls
        from bookmark_page b
        left outer join bookark_page_tags_array
        on bookark_page_tags_array.bookmark_id = b.id
        left outer join bookark_page_episodes_array
        on bookark_page_episodes_array.bookmark_id = b.id
        left outer join archives_array
        on archives_array.bookmark_id = b.id
        order by b.created_at desc, b.title desc, b.url desc
      `

  return bookarmsQuery
}

export const afterToBeforeBookmarkQuery = ({
  perPage,
  tag,
  ownerId,
  after,
  sensitive,
  starred,
  toread
}) => {
  const perPageAfterOffset = perPage + 2
  const afterCalcBookarksQuery = SQL`
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
            where bm.owner_id = ${ownerId}
            and bm.created_at >= ${after}
            ${!sensitive ? SQL`AND bm.sensitive = false` : SQL``}
            ${starred ? SQL`AND bm.starred = true` : SQL``}
            ${toread ? SQL`AND bm.toread = true` : SQL``}
            ${tag
              ? SQL`
                and t.name = ${tag}
                and t.owner_id = ${ownerId}`
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

  return afterCalcBookarksQuery
}
