import { html } from 'uland-isomorphic'
import { register } from './client.js'

export default async function () {
  return html`${register()}`
}
