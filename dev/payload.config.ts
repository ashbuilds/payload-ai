import { payloadAiPlugin } from '@ai-stack/payloadcms'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Media } from './collections/Media.js'
import { Posts } from './collections/Posts.js'
import { testEmailAdapter } from './helpers/testEmailAdapter.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

if (!process.env.ROOT_DIR) {
  process.env.ROOT_DIR = dirname
}

const buildConfigWithMemoryDB = async () => {

  return buildConfig({
    admin: {
      dependencies: {
        InstructionsProvider: {
          type: 'component',
          path: '@ai-stack/payloadcms/client#InstructionsProvider',
        },
      },
      importMap: {
        baseDir: path.resolve(dirname),
      },
    },
    collections: [
      Media,
      Posts,
    ],
    db: sqliteAdapter({
      client: {
        url: process.env.DATABASE_URI || `file:${path.resolve(dirname, 'dev.db')}`,
      },
      // Automatically push schema changes in non-production for frictionless dev
      push: process.env.NODE_ENV !== 'production',
    }),
    editor: lexicalEditor(),
    localization: {
      defaultLocale: 'en-US',
      locales: ['en-US', 'ja-JA'],
    },
    email: testEmailAdapter,
    plugins: [
      payloadAiPlugin({
        collections: {
          [Posts.slug]: true,
        },
        debugging: process.env.NODE_ENV !== 'production',
        disableSponsorMessage: false,
        generatePromptOnInit: process.env.NODE_ENV !== 'production',
        mediaUpload: async (result, { collection, request }) => {
          return request.payload.create({
            collection,
            data: result.data,
            file: result.file,
          })
        },
        uploadCollectionSlug: 'media',
      }),
    ],
    secret: process.env.PAYLOAD_SECRET || 'test-secret_key',
    sharp,
    typescript: {
      outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
  })
}

export default buildConfigWithMemoryDB()
