import type { CollectionSlug } from 'payload'

import type {
  ActionMenuItems,
  PluginConfig,
  PromptFieldGetterContext,
} from '../types.js'

import { defaultPrompts } from '../ai/prompts.js'
import { asyncHandlebars } from '../libraries/handlebars/asyncHandlebars.js'
import { handlebarsHelpersMap } from '../libraries/handlebars/helpersMap.js'
import { replacePlaceholders } from '../libraries/handlebars/replacePlaceholders.js'

const buildRichTextSystem = (baseSystem: string, layout: string) => {
  return `${baseSystem}

RULES:
- Generate original and unique content based on the given topic.
- Strictly adhere to the specified layout and formatting instructions.
- Utilize the provided rich text editor tools for appropriate formatting.
- Ensure the output follows the structure of the sample output object.
- Produce valid JSON with no undefined or null values.
---
LAYOUT INSTRUCTIONS:
${layout}

---
ADDITIONAL GUIDELINES:
- Ensure coherence and logical flow between all sections.
- Maintain a consistent tone and style throughout the content.
- Use clear and concise language appropriate for the target audience.
`
}

export const assignPrompt = async (
  action: ActionMenuItems,
  {
    type,
    actionParams,
    collection,
    context,
    field,
    layout,
    locale,
    pluginConfig,
    systemPrompt = '',
    template,
  }: {
    actionParams: Record<any, any>
    collection: CollectionSlug
    context: object
    field: string
    layout: string
    locale: string
    pluginConfig: PluginConfig
    systemPrompt: string
    template: string
    type: string
  },
) => {
  const extendedContext = extendContextWithPromptFields(context, { type, collection }, pluginConfig)
  const prompt = await replacePlaceholders(template, extendedContext)
  const toLexicalHTML = type === 'richText' ? handlebarsHelpersMap.toHTML.name : ''

  const assignedPrompts = {
    layout: type === 'richText' ? layout : undefined,
    prompt,
    //TODO: Define only once on a collection level
    system: type === 'richText' ? buildRichTextSystem(systemPrompt, layout) : undefined,
  }

  if (action === 'Compose') {
    if (locale && locale !== 'en') {
      /**
       * NOTE: Avoid using the "system prompt" for setting the output language,
       * as it causes quotation marks to appear in the output (Currently only tested with openai models).
       * Appending the language instruction directly to the prompt resolves this issue. - revalidate
       **/
      assignedPrompts.prompt += `
    ---  
    OUTPUT LANGUAGE: ${locale}
    `
    }

    return assignedPrompts
  }

  const prompts = [...(pluginConfig.prompts || []), ...defaultPrompts]
  const foundPrompt = prompts.find((p) => p.name === action)
  const getLayout = foundPrompt?.layout
  const getSystemPrompt = foundPrompt?.system

  let updatedLayout = layout
  if (getLayout) {
    updatedLayout = getLayout()
  }

  const system = getSystemPrompt
    ? getSystemPrompt({
        ...(actionParams || {}),
        prompt,
        systemPrompt,
      })
    : ''

  return {
    layout: updatedLayout,
    // TODO: revisit this toLexicalHTML
    prompt: await replacePlaceholders(`{{${toLexicalHTML} ${field}}}`, extendedContext),
    system: type === 'richText' ? buildRichTextSystem(system, updatedLayout) : system,
  }
}

export const extendContextWithPromptFields = (
  data: object,
  ctx: PromptFieldGetterContext,
  pluginConfig: PluginConfig,
) => {
  const { promptFields = [] } = pluginConfig
  const fieldsMap = new Map(
    promptFields
      .filter((f) => !f.collections || f.collections.includes(ctx.collection))
      .map((f) => [f.name, f]),
  )
  return new Proxy(data, {
    get: (target, prop: string) => {
      const field = fieldsMap.get(prop)
      if (field?.getter) {
        const value = field.getter(data, ctx)
        return Promise.resolve(value).then((v) => new asyncHandlebars.SafeString(v))
      }
      // {{prop}} escapes content by default. Here we make sure it won't be escaped.
      const value = typeof target === 'object' ? (target as any)[prop] : undefined
      return typeof value === 'string' ? new asyncHandlebars.SafeString(value) : value
    },
    // It's used by the handlebars library to determine if the property is enumerable
    getOwnPropertyDescriptor: (target, prop) => {
      const field = fieldsMap.get(prop as string)
      if (field) {
        return {
          configurable: true,
          enumerable: true,
        }
      }
      return Object.getOwnPropertyDescriptor(target, prop)
    },
    has: (target, prop) => {
      return fieldsMap.has(prop as string) || (target && prop in target)
    },
    ownKeys: (target) => {
      return [...fieldsMap.keys(), ...Object.keys(target || {})]
    },
  })
}
