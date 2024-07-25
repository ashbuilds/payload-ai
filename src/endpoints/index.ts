import type { PayloadRequest } from 'payload'

import { StreamTextResult } from 'ai'
import { createStreamableValue } from 'ai/rsc'
import Handlebars from 'handlebars'

import type { Endpoints, MenuItems } from '../types.js'

import { GenerationModels } from '../ai/models/index.js'
import { Instructions } from '../types.js'

const replacePlaceholders = (prompt: string, values: object) => {
  return Handlebars.compile(prompt)(values)
}

const assignPrompt = (
  action: MenuItems,
  { context, field, template }: { context: object; field: string; template: string },
) => {
  const prompt = replacePlaceholders(template, context)

  switch (action) {
    case 'Compose':
      return {
        prompt,
        system: '',
      }
    case 'Expand':
      return {
        prompt: replacePlaceholders(`{{${field}}}`, context),
        system: `You are a creative writer and subject matter expert. 
        Your task is to expand on the given text, adding depth, detail, 
        and relevant information while maintaining the original tone and style.
        
        -------------
        INSTRUCTIONS:
        - Read the given text carefully to understand its main ideas and tone.
        - Expand the text by adding more details, examples, explanations, or context.
        - Maintain the original tone, style, and intent of the text.
        - Ensure the expanded version flows naturally and coherently.
        - Do not contradict or alter the original meaning or message.
        -------------`,
      }
    case 'Proofread':
      return {
        prompt: replacePlaceholders(`{{${field}}}`, context),
        system: `You are an English language expert. Your task is to carefully proofread the given text, 
      focusing solely on correcting grammar and spelling mistakes. Do not alter the content, 
      style, or tone of the original text in any way.
      
      -------------
      INSTRUCTIONS:
      - Read the text carefully and identify any grammar or spelling errors.
      - Make corrections only to fix grammar and spelling mistakes.
      - Do not change the content, meaning, tone, or style of the original text.
      - Always return the full text, whether corrections were made or not.
      - Do not provide any additional comments or analysis.
      -------------`,
      }
    case 'Rephrase':
      return {
        prompt: replacePlaceholders(`{{${field}}}`, context),
        system: `You are a skilled language expert. Rephrase the given text while maintaining its original meaning, tone, and emotional content. Use different words and sentence structures where possible, but preserve the overall style and sentiment of the original.
        -------------
        INSTRUCTIONS:
        - Follow the instructions below to rephrase the text.
        - Retain the original meaning, tone, and emotional content.
        - Use different vocabulary and sentence structures where appropriate.
        - Ensure the rephrased text conveys the same message and feeling as the original.
        ${prompt ? '- Below is a previous prompt that was used to generate the original text.' : ''}
          ${prompt}
        -------------`,
      }
    case 'Simplify':
      return {
        prompt: replacePlaceholders(`{{${field}}}`, context),
        system: `You are a skilled communicator specializing in clear and concise writing. 
        Your task is to simplify the given text, making it easier to understand while retaining its core message.
        -------------
        INSTRUCTIONS:
        - Read the given text carefully to grasp its main ideas and purpose.
        - Simplify the language, using more common words and shorter sentences.
        - Remove unnecessary details or jargon while keeping essential information.
        - Maintain the original meaning and key points of the text.
        - Aim for clarity and readability suitable for a general audience.
        - The simplified text should be more concise than the original.
        - Follow rules of PREVIOUS PROMPT, if provided.
        
        ${
          prompt
            ? `
        PREVIOUS PROMPT:
        ${prompt}
        `
            : ''
        }
        -------------`,
      }
    case 'Summarize':
      return {
        prompt: replacePlaceholders(`{{${field}}}`, context),
        system: '',
      }
    case 'Tone':
      return {
        prompt: replacePlaceholders(`{{${field}}}`, context),
        system: '',
      }
    case 'Translate':
      return {
        prompt: replacePlaceholders(`{{${field}}}`, context),
        system: '',
      }
    default:
      return {
        prompt: replacePlaceholders(template, context),
        system: '',
      }
  }
}

export const endpoints: Endpoints = {
  textarea: {
    handler: async (req: PayloadRequest) => {
      const data = await req.json?.()

      console.log('incoming data -----> ', JSON.stringify(data, null, 2))
      const { locale = 'en', options } = data
      const { action, instructionId } = options
      const contextData = data.doc

      let instructions = { 'model-id': '', prompt: '' }

      if (instructionId) {
        // @ts-expect-error
        instructions = await req.payload.findByID({
          id: instructionId,
          collection: 'instructions',
        })
      }

      const { prompt: promptTemplate = '' } = instructions

      const fieldName = instructions['schema-path']?.split('.').pop()
      const prompts = assignPrompt(action, {
        context: contextData,
        field: fieldName,
        template: promptTemplate,
      })

      console.log('Running with prompts:', prompts)
      const { defaultLocale, locales = [] } = req.payload.config.localization || {}
      const localeData = locales.find((l) => {
        return l.code === locale
      })

      const localeInfo = localeData?.label[defaultLocale] || locale

      //TODO: remove this
      const opt = {
        locale: localeInfo,
        modelId: instructions['model-id'],
      }

      const model = GenerationModels.find((model) => model.id === opt.modelId)
      const settingsName = model.settings?.name
      const modelOptions = instructions[settingsName] || {}

      return model
        .handler?.(prompts.prompt, {
          ...modelOptions,
          ...opt,
          system: prompts.system || modelOptions.system,
        })
        .catch((error) => {
          console.error('Error: endpoint - generating text:', error)
          return new Response(JSON.stringify(error.message), { status: 500 })
        })
    },
    method: 'post',
    path: '/ai/generate/textarea',
  },
  upload: {
    handler: async (req: PayloadRequest) => {
      const data = await req.json?.()

      const { options } = data
      const { instructionId, uploadCollectionSlug } = options
      const contextData = data.doc

      let instructions = { 'model-id': '', prompt: '' }

      if (instructionId) {
        // @ts-expect-error
        instructions = await req.payload.findByID({
          id: instructionId,
          collection: 'instructions',
        })
      }

      console.log('Instructions', instructions)
      console.log('data.doc', contextData)

      const { prompt: promptTemplate = '' } = instructions

      const text = replacePlaceholders(promptTemplate, contextData)
      const modelId = instructions['model-id']
      console.log('prompt text:', text)

      const model = GenerationModels.find((model) => model.id === modelId)
      const settingsName = model.settings?.name
      const modelOptions = instructions[settingsName] || {}
      console.log('modelOptions', modelOptions)

      const result = await model.handler?.(text, modelOptions)

      const assetData = await req.payload.create({
        collection: uploadCollectionSlug,
        data: result.data,
        file: result.file,
      })

      console.log('assetData', assetData)

      return new Response(
        JSON.stringify({
          result: {
            id: assetData.id,
            alt: assetData.alt,
          },
        }),
      )
    },
    method: 'post',
    path: '/ai/generate/upload',
  },
}
