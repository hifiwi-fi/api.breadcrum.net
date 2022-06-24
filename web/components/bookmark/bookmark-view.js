/* eslint-env browser */
import { Component, html } from 'uland-isomorphic'
import { toread } from '../toread/index.js'
import { star } from '../star/index.js'
import { sensitive } from '../sensitive/index.js'
import { useWindow } from '../../hooks/useWindow.js'
import { useQuery } from '../../hooks/useQuery.js'

export const bookmarkView = Component(({
  bookmark: b,
  onEdit = () => {},
  onToggleToread = () => {},
  onToggleStarred = () => {},
  onToggleSensitive = () => {}
} = {}) => {
  const window = useWindow()
  const { pushState } = useQuery()

  const onPageNav = (ev) => {
    const url = new URL(window.location)
    const newUrl = new URL(ev.currentTarget.href)

    if (url.pathname === newUrl.pathname) {
      ev.preventDefault()
      pushState(ev.currentTarget.href)
    }
  }

  return html`
    <div class="bc-bookmark-view">
      <div>
        ${toread({
          toread: b.toread,
          onclick: onToggleToread
        })}
        ${star({
          starred: b.starred,
          onclick: onToggleStarred
        })}
        ${sensitive({
          sensitive: b.sensitive,
          onclick: onToggleSensitive
        })}
        <a class="${b.toread
            ? 'bc-bookmark-title-toread'
            : null}"
           href="${b.url}"
           target="_blank"
        >
          ${b.title}
        </a>
      </div>
      <div class="bc-bookmark-url-display"><a href="${b.url}">${b.url}</a></div>
      ${b.note ? html`<div>${b.note}</div>` : null}
      <div>
      ${b.tags?.length > 0
        ? html`
          <div class="bc-tags-display">
            🏷
            ${b.tags.map(tag => html` <a onclick="${onPageNav}" href=${`/bookmarks/?tag=${tag}`}>${tag}</a> `)}
          </div>`
        : null
      }
      <div class="bc-date">
        <a href="${`./view/?id=${b.id}`}">
          <time datetime="${b.created_at}">
            ${(new Date(b.created_at)).toLocaleString()}
          </time>
        </a>
      </div>
      <div>
        <button onClick=${onEdit}>edit</button>
      </div>
    </div>`
})
