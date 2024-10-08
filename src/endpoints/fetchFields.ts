import type { Endpoint, PayloadRequest } from 'payload'

import { PLUGIN_FETCH_FIELDS_ENDPOINT, PLUGIN_INSTRUCTIONS_TABLE } from '../defaults.js'

export const fetchFields: Endpoint = {
  handler: async (req: PayloadRequest) => {
    const { docs = [] } = await req.payload.find({
      collection: PLUGIN_INSTRUCTIONS_TABLE,
      pagination: false,
    })

    const fieldMap = {}
    docs.forEach((doc) => {
      fieldMap[doc['schema-path']] = {
        id: doc.id,
        fieldType: doc['field-type'],
      }
    })

    return Response.json(fieldMap)
  },
  method: 'get',
  path: PLUGIN_FETCH_FIELDS_ENDPOINT,
}
