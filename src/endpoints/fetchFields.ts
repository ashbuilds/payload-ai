import type { Endpoint, PayloadRequest } from 'payload'

import type { PluginConfig, SerializedPromptField } from '../types.js'

import { PLUGIN_FETCH_FIELDS_ENDPOINT, PLUGIN_INSTRUCTIONS_TABLE } from '../defaults.js'

export const fetchFields: (config: PluginConfig) => Endpoint = (config) => {
  const { access, options = {}, promptFields = [] } = config
  return {
    handler: async (req: PayloadRequest) => {
      const { docs = [] } = await req.payload.find({
        collection: PLUGIN_INSTRUCTIONS_TABLE,
        pagination: false,
      })

      let isConfigAllowed = true // Users allowed to update prompts by default
      let enabledCollections: string[] = []

      try {
        const { enabledCollections: storedEnabledCollections } = await req.payload.findGlobal({
          slug: 'ai-providers',
        })
        enabledCollections = (storedEnabledCollections as string[]) || []
      } catch (_e) {
        req.payload.logger.error('— AI Plugin: Failed to fetch AI settings')
      }

      if (access?.settings) {
        try {
          isConfigAllowed = await access.settings({ req })
        } catch (_e) {
          req.payload.logger.error(req, '— AI Plugin: Please check your "access.settings" for request')
        }
      }

      const fieldMap: Record<string, { alwaysShow?: boolean; disabled?: boolean; fieldType: string; id: number | string }> = {}
      docs.forEach((doc) => {
        fieldMap[doc['schema-path']] = {
          id: doc.id,
          alwaysShow: !!(doc as Record<string, unknown>)['alwaysShow'],
          disabled: !!doc['disabled'],
          fieldType: doc['field-type'],
        }
      })

      return new Response(
        JSON.stringify({
          ...options,
          debugging: config.debugging,
          enabledCollections,
          fields: fieldMap,
          isConfigAllowed,
          promptFields: promptFields.map(({ getter: _getter, ...field }): SerializedPromptField => {
            return field
          }),
        }),
        {
          headers: {
            'Cache-Control': 'private, max-age=60',
            'Content-Type': 'application/json',
          },
        },
      )
    },
    method: 'get',
    path: PLUGIN_FETCH_FIELDS_ENDPOINT,
  }
}
