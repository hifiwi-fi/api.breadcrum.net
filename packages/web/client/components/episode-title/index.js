/* eslint-env browser */
/* eslint-disable camelcase */
import { Component, html } from 'uland-isomorphic'
import cn from 'classnames'

export const episodeTitle = Component(
  (
    {
      episode: { id, url, error, ready, type, medium, display_title } = {},
      small
    } = {}
  ) => {
    const href = small === true
      ? `/episodes/view/?id=${id}`
      : url

    return html`
    <div class="${cn({
      'bc-episode-title-container': true,
      'bc-episode-title-container-small': small
    })}">
        ${
          error
            ? '❌'
            : ready
              ? '✅'
              : '⏱️'
        }
        ${
          type === 'redirect'
          ? '☁️'
          : type === 'raw'
            ? '🍣'
            : type === 'b2_file'
              ? '🗄'
              : null
        }
        ${
          medium === 'video'
            ? '📼'
            : medium === 'audio'
              ? '💿'
              : null
        }

        <a href="${href}" target="${small ? null : '_blank'}">
          ${display_title}
        </a>
      </div>
  `
  }
)
