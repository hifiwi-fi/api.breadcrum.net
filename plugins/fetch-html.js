import fp from 'fastify-plugin'
import { request as undiciRequest } from 'undici'

// Sorry newspapers, no cheating
const GOOGLE_BOT_UA = 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Googlebot/2.1; +http://www.google.com/bot.html) Chrome/W.X.Y.Z Safari/537.36'

const uaHacks = {
  'twitter.com': GOOGLE_BOT_UA,
  'mobile.twitter.com': GOOGLE_BOT_UA
}

/**
 * This plugin adds a function to fetch html
 */
export default fp(async function (fastify, opts) {
  fastify.decorate('fetchHTML', async function fetchHTML ({
    url
  }) {
    const requestURL = new URL(url)

    const ua = uaHacks[requestURL.hostname] ?? `Breadcrum / ${fastify.pkg.version}`

    const response = await undiciRequest(requestURL, {
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'user-agent': ua
      },
      maxRedirections: 3,
      autoSelectFamily: true,
      headersTimeout: 15000,
      bodyTimeout: 15000
    })

    if (response.statusCode > 299) {
      const text = await response.body.text()
      throw new Error(`Fetch HTML error (${response.statusCode}): ` + text)
    }

    const html = await response.body.text()

    return html
  })
}, {
  name: 'fetch-html',
  dependencies: ['env']
})
