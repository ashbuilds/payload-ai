import { payloadAiPlugin } from '@ai-stack/payloadcms'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { MongoMemoryReplSet } from 'mongodb-memory-server'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Media } from './collections/Media.js'
import { Posts } from './collections/Posts.js'
import { testEmailAdapter } from './helpers/testEmailAdapter.js'
import { seed } from './seed.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

if (!process.env.ROOT_DIR) {
  process.env.ROOT_DIR = dirname
}

const buildConfigWithMemoryDB = async () => {
  if (process.env.NODE_ENV === 'test') {
    const memoryDB = await MongoMemoryReplSet.create({
      replSet: {
        count: 3,
        dbName: 'payloadmemory',
      },
    })

    process.env.DATABASE_URI = `${memoryDB.getUri()}&retryWrites=true`
  }

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
    db: mongooseAdapter({
      ensureIndexes: true,
      url: process.env.DATABASE_URI || '',
    }),
    editor: lexicalEditor(),
    email: testEmailAdapter,
    onInit: async (payload) => {
      await seed(payload)
    },
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
