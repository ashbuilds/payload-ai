import dot from 'dot-object'
import { NodeHtmlMarkdown, NodeHtmlMarkdownOptions } from 'node-html-markdown'

function extractTextFromHtml(html) {
  const text = NodeHtmlMarkdown.translate(
    /* html */ html,
    /* options (optional) */ {},
    /* customTranslators (optional) */ undefined,
    /* customCodeBlockTranslators (optional) */ undefined,
  )

  // const $ = cheerio.load(html);
  //
  // // Remove script and style elements
  // $('script, style').remove();
  //
  // // Extract text from body
  // let text = $('body').text();
  //
  // // Clean up whitespace
  // text = text.replace(/\s+/g, ' ').trim();

  return JSON.stringify(text)
}

type TaskHeader = {
  id: string
  key: string
  value: string
}

const toRequestHeaders = (headers: TaskHeader[]) => {
  const requestHeaders = {}
  headers.forEach((header) => {
    requestHeaders[header.key.toLocaleLowerCase()] = header.value
  })
  return requestHeaders
}

import type { Payload } from 'payload'

import { openai } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import * as process from 'node:process'

import { GenerationModels } from '../ai/models/index.js'

const analyse = async (params: any) => {
  try {
    const model = GenerationModels?.find((model) => model.id === params['model-id'])
    if (!model) {
      console.error('Analyse: No model found.')
      return null
    }

    const { settings = { name: '' } } = model
    const options = params[settings?.name]

    const generateResult = await generateObject({
      model: openai(options.model),
      prompt:
        params.description +
        `
      ---
      Content: ${params.previousResult}
    `,
      schema: null,
      system: `You are an advanced AI system specialized in text classification. Your primary function is to analyze raw text input and categorize it into predefined classes or categories.`,
    })

    return JSON.stringify(generateResult.object)
  } catch (e) {
    console.error('Error parsing analyse:', e)
  }
}

export const TasksHandler = {
  compose: async (params: any, payload: Payload) => {
    const apiUrl = payload.getAPIURL()

    const generated: any = {}
    let updatedDocument: any = {}
    for (const doc of params.fields) {
      const schemaPath = doc['schema-path']
      const fieldType = doc['field-type']
      const instructionId = doc.id

      if (fieldType && ['richText', 'text', 'textarea'].includes(fieldType)) {
        const result = await fetch(
          process.env.NEXT_PUBLIC_SERVER_URL + `${apiUrl}/plugin-ai/generate`,
          {
            body: JSON.stringify({
              doc: updatedDocument[params.collection],
              options: {
                action: 'Compose',
                context: params.previousResult,
                instructionId,
              },
            }),
            headers: {
              contentType: 'application/json',
            },
            method: 'POST',
          },
        )
        const { text } = await result.json()

        if (schemaPath) {
          generated[schemaPath] = text[schemaPath] ? text[schemaPath] : text
          updatedDocument = dot.object(generated)
        }
      }

      if (fieldType && ['upload'].includes(fieldType)) {
        const result = await fetch(
          process.env.NEXT_PUBLIC_SERVER_URL + `${apiUrl}/plugin-ai/generate/upload`,
          {
            body: JSON.stringify({
              doc: updatedDocument[params.collection],
              options: {
                action: 'Compose',
                context: params.previousResult,
                instructionId,
                uploadCollectionSlug: 'media',
              },
            }),
            headers: {
              contentType: 'application/json',
            },
            method: 'POST',
          },
        )

        if (schemaPath) {
          const response = await result.json()
          if (response?.result) {
            generated[schemaPath] = response.result.id
            updatedDocument = dot.object(generated)
          }
        }
      }
    }

    console.log('final update: ', updatedDocument)

    await payload
      .create({
        collection: params.collection,
        data: updatedDocument[params.collection],
      })
      .then((data: any) => {
        console.log('done -> ', data)
      })
      .catch((err: any) => {
        console.error('generation: ', err)
      })
  },
  request: async (params: any) => {
    const requestHeaders = toRequestHeaders(params.headers)
    console.log('requestHeaders - ', requestHeaders)
    const response = await fetch(params['api-url'], {
      headers: toRequestHeaders(params.headers),
    })

    if (requestHeaders['content-type'] === 'text/html') {
      return extractTextFromHtml(await response.text())
    }

    if (requestHeaders['content-type'] === 'application/json') {
      return response.json()
    }
  },
  'text-classification': async (params: any) => {
    // return analyse(params);
  },
}
