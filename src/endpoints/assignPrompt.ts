import type { ActionMenuItems } from '../types.js'

import { exampleOutput } from '../ai/models/example.js'
import { defaultPrompts } from '../ai/prompts.js'
import { handlebarsHelpersMap } from '../libraries/handlebars/helpersMap.js'
import { replacePlaceholders } from '../libraries/handlebars/replacePlaceholders.js'
// `${options.system}
//
// LAYOUT INSTRUCTIONS:
// ${options.layout}
//
// SAMPLE OUTPUT OBJECT:
// ${JSON.stringify(exampleOutput)}`
export const assignPrompt = async (
  action: ActionMenuItems,
  {
    type,
    actionParams,
    context,
    doc,
    field,
    layout,
    systemPrompt = '',
    template,
  }: {
    actionParams: Record<any, any>
    context?: string
    doc: object
    field: string
    layout: string
    systemPrompt: string
    template: string
    type: string
  },
) => {
  const prompt = await replacePlaceholders(template, doc)

  if (context) {
    systemPrompt = `${systemPrompt}
    -----
    CONTEXT: ${JSON.stringify(context)}\n
    `
  }

  if (type === 'richText') {
    systemPrompt = `${systemPrompt}
    
    LAYOUT INSTRUCTIONS:
    ${layout}
    
    SAMPLE OUTPUT OBJECT:
    ${JSON.stringify(exampleOutput)}`
  }

  const toLexicalHTML = type === 'richText' ? handlebarsHelpersMap.toHTML.name : ''
  // console.log("systemPrompt : ", systemPrompt);
  const assignedPrompts = {
    layout: type === 'richText' ? layout : undefined,
    prompt,
    //TODO: Define only once on a collection level
    system: context || type === 'richText' ? systemPrompt : undefined,
  }

  if (action === 'Compose') {
    return assignedPrompts
  }

  const { layout: getLayout, system: getSystemPrompt } = defaultPrompts.find(
    (p) => p.name === action,
  )

  let updatedLayout = layout
  if (getLayout) {
    //TODO: add this, for other functionalities
    updatedLayout = getLayout()
  }

  const system = getSystemPrompt({
    ...(actionParams || {}),
    prompt,
    systemPrompt,
  })

  return {
    // TODO: revisit this toLexicalHTML
    prompt: await replacePlaceholders(`{{${toLexicalHTML} ${field}}}`, doc),
    system,
  }
}
