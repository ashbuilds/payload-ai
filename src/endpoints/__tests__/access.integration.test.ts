import type { Payload, PayloadRequest } from 'payload'

import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { APIError, buildConfig, createLocalReq, getPayload } from 'payload'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import type { PluginConfig } from '../../types.js'

import { PLUGIN_INSTRUCTIONS_TABLE } from '../../defaults.js'
import { fetchReferenceImage } from '../../utilities/fetchReferenceImage.js'
import { fetchFields } from '../fetchFields.js'
import { endpoints } from '../index.js'

vi.mock('../../utilities/fetchReferenceImage.js', () => ({ fetchReferenceImage: vi.fn() }))

let payload: Payload
let ownDoc: any
let otherDoc: any
let ownInstruction: any
let otherInstruction: any
const editor = { id: 1000, collection: 'users', role: 'editor', tenant: 'a' }
const uploader = { ...editor, role: 'uploader' }
const model = vi.fn((_prompt: string, _options: unknown) =>
  Promise.resolve({
    data: { alt: 'Generated test asset' },
  }),
)
const config = {
  generationModels: [{ id: 'test', handler: model, settings: { name: 'testSettings' } }],
} as unknown as PluginConfig

const request = async (body: any, user: any = editor): Promise<PayloadRequest> => {
  const req = await createLocalReq({ user }, payload)
  req.json = () => Promise.resolve(body)
  req.headers = new Headers({ Authorization: 'Bearer TEST-TOKEN' })
  return req
}
const body = () => ({
  collectionSlug: 'documents',
  doc: {},
  documentId: ownDoc.id,
  options: { action: 'Compose', instructionId: ownInstruction.id },
})

beforeAll(async () => {
  payload = await getPayload({
    config: await buildConfig({
      collections: [
        {
          slug: 'users',
          auth: true,
          fields: [
            { name: 'tenant', type: 'text' },
            { name: 'role', type: 'text' },
          ],
        },
        {
          slug: 'documents',
          access: { read: ({ req }) => ({ tenant: { equals: req.user?.tenant } }) },
          fields: [
            { name: 'tenant', type: 'text' },
            { name: 'title', type: 'text' },
            { name: 'privateValue', type: 'text', access: { read: () => false } },
          ],
          versions: { drafts: true },
        },
        {
          slug: PLUGIN_INSTRUCTIONS_TABLE,
          access: { read: ({ req }) => ({ tenant: { equals: req.user?.tenant } }) },
          fields: [
            { name: 'tenant', type: 'text' },
            { name: 'prompt', type: 'text' },
            { name: 'schema-path', type: 'text' },
            { name: 'model-id', type: 'text' },
            { name: 'field-type', type: 'text' },
            { name: 'relation-to', type: 'text' },
            { name: 'images', type: 'json' },
          ],
        },
        {
          slug: 'assets',
          access: { create: ({ req }) => req.user?.role === 'uploader' },
          fields: [{ name: 'alt', type: 'text' }],
        },
      ],
      db: sqliteAdapter({ client: { url: ':memory:' }, push: true }),
      secret: 'disposable-integration-test-secret',
      telemetry: false,
      typescript: { autoGenerate: false },
    }),
  })
  ownDoc = await payload.create({
    collection: 'documents',
    data: { _status: 'draft', privateValue: 'FIELD_SECRET', tenant: 'a', title: 'Allowed draft' },
  })
  otherDoc = await payload.create({
    collection: 'documents',
    data: { _status: 'draft', tenant: 'b', title: 'OTHER_TENANT_SECRET' },
  })
  for (const tenant of ['a', 'b']) {
    const instruction = await payload.create({
      collection: PLUGIN_INSTRUCTIONS_TABLE,
      data: {
        'field-type': 'upload',
        images: [],
        'model-id': 'test',
        prompt: '{{title}} {{privateValue}}',
        'relation-to': 'assets',
        'schema-path': `documents.${tenant === 'a' ? 'title' : 'privateValue'}`,
        tenant,
      },
    })
    if (tenant === 'a') {
      ownInstruction = instruction
    } else {
      otherInstruction = instruction
    }
  }
})
afterAll(async () => {
  await payload?.destroy()
})
beforeEach(() => {
  vi.clearAllMocks()
})

const captureError = (operation: unknown) =>
  Promise.resolve(operation).then(
    () => {
      throw new Error('Expected a thrown Payload API error')
    },
    (error: unknown) => {
      expect(error).toBeInstanceOf(APIError)
      return error as APIError
    },
  )

describe('generation access against the real Payload Local API', () => {
  it('blocks cross-tenant source reads before any model or image request', async () => {
    const res = await captureError(
      endpoints(config).upload.handler(
        await request({ ...body(), documentId: otherDoc.id }, uploader),
      ),
    )
    expect([403, 404]).toContain(res.status)
    expect(model).not.toHaveBeenCalled()
    expect(fetchReferenceImage).not.toHaveBeenCalled()
  })

  it('fails closed on a missing source document', async () => {
    const res = await captureError(
      endpoints(config).upload.handler(await request({ ...body(), documentId: 999999 }, uploader)),
    )
    expect(res.status).toBe(404)
    expect(model).not.toHaveBeenCalled()
  })

  it.each(['upload', 'textarea'] as const)(
    'blocks another tenant’s instruction in %s',
    async (endpoint) => {
      const res = await captureError(
        endpoints(config)[endpoint].handler(
          await request(
            { ...body(), options: { action: 'Compose', instructionId: otherInstruction.id } },
            uploader,
          ),
        ),
      )
      expect([403, 404]).toContain(res.status)
      expect(model).not.toHaveBeenCalled()
      expect(fetchReferenceImage).not.toHaveBeenCalled()
    },
  )

  it('allows an authorized draft read and media create while stripping protected fields', async () => {
    const res = await endpoints(config).upload.handler(await request(body(), uploader))
    expect(res.status).toBe(200)
    expect(model.mock.calls[0][0]).toBe('Allowed draft ')
    const data = await res.json()
    expect(data.result.id).toBeTruthy()
  })

  it('enforces collection create permission for generated media', async () => {
    const before = await payload.count({ collection: 'assets' })
    const res = await captureError(endpoints(config).upload.handler(await request(body())))
    expect(res.status).toBe(403)
    expect((await payload.count({ collection: 'assets' })).totalDocs).toBe(before.totalDocs)
  })

  it('allows authorized text generation', async () => {
    const textModel = vi.fn((prompt: string) => Promise.resolve(new Response(prompt)))
    const textConfig = {
      ...config,
      generationModels: [{ id: 'test', handler: textModel, settings: { name: 'testSettings' } }],
    } as unknown as PluginConfig
    const res = await endpoints(textConfig).textarea.handler(
      await request({ ...body(), doc: { title: 'Caller text' } }),
    )
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('Caller text ')
  })

  it.each(['upload', 'textarea'] as const)(
    'rejects anonymous and generation-denied callers in %s',
    async (endpoint) => {
      const anonymous = await captureError(
        endpoints(config)[endpoint].handler(await request(body(), null)),
      )
      expect(anonymous.status).toBe(401)
      const denied = await captureError(
        endpoints({ ...config, access: { generate: () => false } })[endpoint].handler(
          await request(body()),
        ),
      )
      expect(denied.status).toBe(403)
      expect(model).not.toHaveBeenCalled()
    },
  )
})

describe('instruction metadata', () => {
  it('requires authentication', async () => {
    const res = await captureError(fetchFields(config).handler(await request({}, null)))
    expect(res.status).toBe(401)
  })
  it('only returns instructions readable by the caller', async () => {
    const res = await fetchFields(config).handler(await request({}))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(Object.keys(data.fields)).toEqual(['documents.title'])
  })
  it('fails closed if the settings permission callback throws', async () => {
    const res = await fetchFields({
      ...config,
      access: {
        settings: () => {
          throw new Error('failure')
        },
      },
    }).handler(await request({}))
    expect((await res.json()).isConfigAllowed).toBe(false)
  })
})
