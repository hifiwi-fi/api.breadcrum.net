import { writeFile } from 'fs/promises'
import { resolve } from 'path'
import { schema } from '../plugins/env.js'

const __dirname = import.meta.dirname

// This script sets up a default .env dotenv file for use in development
// Do not run this in production or when deploying.

if (process.env['ENV'] !== 'production') {
  const dotenv = []

  for (const [name, opts] of Object.entries(schema.properties)) {
    if (opts.default != null) dotenv.push(`${name}=${opts.default}`)
  }

  dotenv.push('')
  await writeFile(resolve(__dirname, '../.env'), dotenv.join('\n'))
  console.log('wrote development .env file')
} else {
  console.log('skipping creation of development .env file')
}
