import type { Endpoint, PayloadRequest } from 'payload'

import type { PluginConfig, SerializedPromptField } from '../types.js'

import { PLUGIN_FETCH_FIELDS_ENDPOINT, PLUGIN_INSTRUCTIONS_TABLE } from '../defaults.js'

export const fetchFields: (config: PluginConfig) => Endpoint = (
  config
) => {
  const {access, options = {}, promptFields = []} = config
  return {
    handler: async (req: PayloadRequest) => {
      const { docs = [] } = await req.payload.find({
        collection: PLUGIN_INSTRUCTIONS_TABLE,
        pagination: false,
      })

      let isConfigAllowed = true // Users allowed to update prompts by default

      if (access?.settings) {
        try {
          isConfigAllowed = await access.settings({ req })
        } catch (e) {
          req.payload.logger.error(req, 'Please check your "access.settings" for request')
        }
      }

      const fieldMap = {}
      docs.forEach((doc) => {
        fieldMap[doc['schema-path']] = {
          id: doc.id,
          fieldType: doc['field-type'],
        }
      })

      return Response.json({
        ...options,
        fields: fieldMap,
        isConfigAllowed,
        promptFields: promptFields.map(({getter: _getter, ...field}): SerializedPromptField => {
          return field
        }),
      })
    },
    method: 'get',
    path: PLUGIN_FETCH_FIELDS_ENDPOINT,
  }
}
