import type { CollectionSlug, PayloadRequest } from 'payload'

import type { GenerationHooks } from '../types.js'

import { setPayloadFieldValue } from '../utilities/setPayloadFieldValue.js'

export const generationHooks = (request: PayloadRequest, document): GenerationHooks => {
  console.log('documentData: ', document)

  const payload = request.payload
  const { data: doc, documentId, schemaPath } = document
  const collection = schemaPath.split('.').shift() as CollectionSlug

  return {
    onFinish: async (response) => {
      console.log('onFinish: ', response)
      const { object, text } = response


      console.log('object: ', JSON.stringify(object, null, 2))
      const daaat = setPayloadFieldValue(doc, schemaPath, text || object);

      console.log('daaat: ', JSON.stringify(daaat, null, 2) );
      try {
        await payload.update({
          id: documentId,
          collection,
          data: setPayloadFieldValue(doc, schemaPath, text || object),
          overrideAccess: true,
        })
      }
      catch (error) {
        console.error(`generationHooks onFinish: `, error)
      }
    },
  }
}
