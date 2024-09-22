import type { ActionMenuItems } from '../types.js'

import { defaultPrompts } from '../ai/prompts.js'
import { handlebarsHelpersMap } from '../libraries/handlebars/helpersMap.js'
import { replacePlaceholders } from '../libraries/handlebars/replacePlaceholders.js'

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
    template
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
  // if(typeof context === 'string') {
  //   prompt = `${template}
  //
  //   REFERENCE FOR CONTEXT: ${context}\n
  //   `
  // }

  if(context){
    systemPrompt = systemPrompt + `
    -----
    CONTEXT: ${context}\n
    `
  }

  const toLexicalHTML = type === 'richText' ? handlebarsHelpersMap.toHTML.name : ''
  const assignedPrompts = {
    layout,
    prompt,
    system: systemPrompt,
  }

  if (action === 'Compose') {
    return assignedPrompts
  }

  const { layout: getLayout, system: getSystemPrompt } = defaultPrompts.find(
    (p) => p.name === action,
  )

  let updatedLayout = layout
  if (getLayout) {
    updatedLayout = getLayout()
  }

  const system = getSystemPrompt({
    ...(actionParams || {}),
    prompt,
    systemPrompt,
  })

  return {
    layout: updatedLayout,
    // TODO: revisit this toLexicalHTML
    prompt: await replacePlaceholders(`{{${toLexicalHTML} ${field}}}`, doc),
    system,
  }
}