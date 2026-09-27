import type { Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import type { Payload, SanitizedConfig } from 'payload'

import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { APIError, buildConfig, getPayload, handleEndpoints } from 'payload'
import { afterAll, beforeAll, beforeEach, expect, it, vi } from 'vitest'

import type { PluginConfig } from '../../types.js'

import { PLUGIN_INSTRUCTIONS_TABLE } from '../../defaults.js'
import { endpoints } from '../index.js'

// Actual HTTP authentication, Payload routing, SQLite, and filesystem storage.
// Only the AI provider is replaced; no API keys or paid services are used.
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=',
  'base64',
)
let payload: Payload
let config: SanitizedConfig
let server: Server
let directory: string
let baseURL: string
let token: string
let mediaID: number | string
let otherMediaID: number | string
let instructionID: number | string
let documentID: number | string
let missingID: number | string
const cacheKey = 'plugin-storage-http-test'
const storageRead = vi.fn()
const model = vi.fn(async (_text: string, options: { images: { data: Blob }[] }) => {
  expect(Buffer.from(await options.images[0].data.arrayBuffer())).toEqual(png)
  return {
    data: { tenant: 'a' },
    file: { name: 'generated.png', data: png, mimetype: 'image/png', size: png.length },
  }
})
const pluginConfig: PluginConfig = {
  collections: {},
  generationModels: [
    {
      id: 'local',
      name: 'Local',
      fields: ['upload'],
      handler: model,
      output: 'image',
      settings: { name: 'localSettings', type: 'group', fields: [] },
    },
  ],
  resolveReferenceImage: async ({ maxBytes, signal, source }) => {
    if (source.kind !== 'media') {
      throw new APIError('Only selected media is supported.', 400)
    }
    const filename = source.document.filename
    if (typeof filename !== 'string' || path.basename(filename) !== filename) {
      throw new APIError('Invalid storage key.', 400)
    }
    const filePath = path.join(directory, filename)
    storageRead(source.document.id)
    if ((await stat(filePath)).size > maxBytes) {
      throw new APIError('File too large.', 400)
    }
    return new Blob([await readFile(filePath, { signal })], { type: 'image/png' })
  },
  uploadCollectionSlug: 'media',
}

async function send(url: string, body: unknown, auth = token) {
  return fetch(`${baseURL}/api${url}`, {
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json',
      ...(auth ? { Authorization: `JWT ${auth}` } : {}),
    },
    method: 'POST',
  })
}
const generationBody = () => ({
  collectionSlug: 'documents',
  doc: {},
  documentId: documentID,
  options: { instructionId: instructionID },
})
async function setImages(id: number | string) {
  await payload.update({
    id: instructionID,
    collection: PLUGIN_INSTRUCTIONS_TABLE,
    data: { images: [{ image: id }] },
  })
}

beforeAll(async () => {
  directory = await mkdtemp(path.join(tmpdir(), 'payload-storage-http-'))
  config = await buildConfig({
    collections: [
      { slug: 'users', auth: true, fields: [{ name: 'tenant', type: 'text' }] },
      {
        slug: 'documents',
        access: { read: ({ req }) => ({ tenant: { equals: req.user?.tenant } }) },
        fields: [{ name: 'tenant', type: 'text' }],
        versions: { drafts: true },
      },
      {
        slug: 'media',
        access: {
          create: ({ req }) => !!req.user,
          read: ({ req }) => ({ tenant: { equals: req.user?.tenant } }),
        },
        fields: [{ name: 'tenant', type: 'text' }],
        upload: { staticDir: directory },
      },
      {
        slug: PLUGIN_INSTRUCTIONS_TABLE,
        access: { read: ({ req }) => !!req.user },
        fields: [
          ...['prompt', 'schema-path', 'field-type', 'model-id', 'relation-to'].map((name) => ({
            name,
            type: 'text' as const,
          })),
          {
            name: 'images',
            type: 'array',
            fields: [{ name: 'image', type: 'upload', relationTo: 'media' }],
          },
        ],
      },
    ],
    db: sqliteAdapter({ client: { url: ':memory:' }, push: true }),
    endpoints: [endpoints(pluginConfig).upload],
    secret: 'local-disposable-http-test-secret',
    telemetry: false,
    typescript: { autoGenerate: false },
  })
  payload = await getPayload({ config, key: cacheKey })
  await payload.create({
    collection: 'users',
    data: { email: 'local@test.example', password: 'disposable-password', tenant: 'a' },
  })
  documentID = (
    await payload.create({ collection: 'documents', data: { _status: 'draft', tenant: 'a' } })
  ).id
  for (const tenant of ['a', 'b']) {
    const media = await payload.create({
      collection: 'media',
      data: { tenant },
      file: { name: `${tenant}.png`, data: png, mimetype: 'image/png', size: png.length },
    })
    if (tenant === 'a') {
      mediaID = media.id
    } else {
      otherMediaID = media.id
    }
  }
  missingID = (
    await payload.create({
      collection: 'media',
      data: { tenant: 'a' },
      file: { name: 'missing.png', data: png, mimetype: 'image/png', size: png.length },
    })
  ).id
  await rm(path.join(directory, 'missing.png'))
  instructionID = (
    await payload.create({
      collection: PLUGIN_INSTRUCTIONS_TABLE,
      data: {
        'field-type': 'upload',
        images: [],
        'model-id': 'local',
        prompt: 'Local image test',
        'relation-to': 'media',
        'schema-path': 'documents.image',
      },
    })
  ).id
  server = createServer(async (incoming, outgoing) => {
    try {
      const chunks: Buffer[] = []
      for await (const chunk of incoming) {
        chunks.push(Buffer.from(chunk))
      }
      const headers = new Headers()
      for (const [name, value] of Object.entries(incoming.headers)) {
        if (value) {
          headers.set(name, Array.isArray(value) ? value.join(', ') : value)
        }
      }
      const response = await handleEndpoints({
        config,
        payloadInstanceCacheKey: cacheKey,
        request: new Request(`${baseURL}${incoming.url}`, {
          headers,
          method: incoming.method,
          ...(chunks.length ? { body: Buffer.concat(chunks) } : {}),
        }),
      })
      outgoing.writeHead(response.status, Object.fromEntries(response.headers))
      outgoing.end(Buffer.from(await response.arrayBuffer()))
    } catch {
      outgoing.writeHead(500)
      outgoing.end('Test server failure')
    }
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  baseURL = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
  const login = await send(
    '/users/login',
    { email: 'local@test.example', password: 'disposable-password' },
    '',
  )
  expect(login.status).toBe(200)
  token = (await login.json()).token
})
beforeEach(async () => {
  await setImages(mediaID)
  vi.clearAllMocks()
})
afterAll(async () => {
  if (server) {
    await new Promise<void>((resolve) => server.close(() => resolve()))
  }
  await payload?.destroy()
  if (directory) {
    await rm(directory, { force: true, recursive: true })
  }
})

it('reads an authorized stored image and persists the generated upload over HTTP', async () => {
  const response = await send('/plugin-ai/generate/upload', generationBody())
  expect(response.status).toBe(200)
  const result = await response.json()
  const generated = await payload.findByID({ id: result.result.id, collection: 'media' })
  expect(await readFile(path.join(directory, generated.filename))).toEqual(png)
  expect(storageRead).toHaveBeenCalledWith(mediaID)
  expect(model).toHaveBeenCalledOnce()
})
it('rejects unauthenticated HTTP requests before storage or generation', async () => {
  const response = await send('/plugin-ai/generate/upload', generationBody(), '')
  expect(response.status).toBe(401)
  expect((await response.json()).errors).toBeDefined()
  expect(storageRead).not.toHaveBeenCalled()
  expect(model).not.toHaveBeenCalled()
})
it('blocks another tenant’s actual stored media', async () => {
  await setImages(otherMediaID)
  const response = await send('/plugin-ai/generate/upload', generationBody())
  // Payload may remove an unreadable populated relationship before our explicit read.
  expect([400, 403, 404]).toContain(response.status)
  expect(storageRead).not.toHaveBeenCalled()
  expect(model).not.toHaveBeenCalled()
})
it('does not generate when the authorized storage file is missing', async () => {
  await setImages(missingID)
  const response = await send('/plugin-ai/generate/upload', generationBody())
  expect(response.status).toBe(500)
  expect(await response.text()).not.toContain(directory)
  expect(model).not.toHaveBeenCalled()
})
it('rejects a prompt URL through the storage policy before generation', async () => {
  await payload.update({
    id: instructionID,
    collection: PLUGIN_INSTRUCTIONS_TABLE,
    data: { prompt: 'https://untrusted.example/image.png' },
  })
  try {
    const response = await send('/plugin-ai/generate/upload', generationBody())
    expect(response.status).toBe(400)
    expect(storageRead).not.toHaveBeenCalled()
    expect(model).not.toHaveBeenCalled()
  } finally {
    await payload.update({
      id: instructionID,
      collection: PLUGIN_INSTRUCTIONS_TABLE,
      data: { prompt: 'Local image test' },
    })
  }
})
