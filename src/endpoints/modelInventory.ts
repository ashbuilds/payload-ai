import type { Endpoint } from 'payload'

import { Forbidden } from 'payload'

import type { PluginConfig } from '../types.js'

import { createModelInventory } from '../ai/providers/modelInventory.js'
import { resolveProviderConfig } from '../ai/providers/resolveProviderConfig.js'
import { PLUGIN_MODELS_ENDPOINT } from '../defaults.js'
import { requireAuthentication } from './access.js'

export const modelInventoryEndpoint = (config: PluginConfig): Endpoint => {
  const inventory = createModelInventory(resolveProviderConfig(config.providers))
  return {
    handler: async (req) => {
      requireAuthentication(req)
      if (config.access?.settings && !(await config.access.settings({ req }))) {
        throw new Forbidden(req.t)
      }
      const provider = req.query?.provider
      if (provider !== 'openai' && provider !== 'anthropic') {
        return Response.json({ error: 'Unknown provider' }, { status: 400 })
      }
      return Response.json(await inventory(provider), {
        headers: { 'Cache-Control': 'private, no-store' },
      })
    },
    method: 'get',
    path: PLUGIN_MODELS_ENDPOINT,
  }
}
