import type { Endpoint, PayloadRequest } from 'payload'

import type { PluginConfigAccess, PluginOptions } from '../types.js'

import { PLUGIN_FETCH_FIELDS_ENDPOINT, PLUGIN_INSTRUCTIONS_TABLE } from '../defaults.js'

export const fetchFields: (access: PluginConfigAccess | undefined, options?: PluginOptions) => Endpoint = (
  access,
  options = {},
) => {
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
          req.payload.logger.error('Please check your "access.settings" for request:', req)
        }
      }

      const fieldMap: Record<string, { fieldType: any; id: any }> = {}
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
      })
    },
    method: 'get',
    path: PLUGIN_FETCH_FIELDS_ENDPOINT,
  }
}
