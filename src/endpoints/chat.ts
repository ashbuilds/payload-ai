import type { Endpoint, PayloadRequest } from 'payload'

import { convertToModelMessages, streamText } from 'ai'

import type { PluginConfig } from '../types.js'

import { openai } from '../ai/models/openai/openai.js'
import { PLUGIN_API_ENDPOINT_AGENT_CHAT, PLUGIN_DEFAULT_OPENAI_MODEL } from '../defaults.js'
import { checkAccess } from '../utilities/checkAccess.js'

export const Chat = (pluginConfig: PluginConfig): Endpoint => ({
  handler: async (req: PayloadRequest) => {
    try {
      await checkAccess(req, pluginConfig)

      const body = await req.json?.()
      const messages = Array.isArray(body?.messages) ? body.messages : []
      const system = "";
      const modelId = PLUGIN_DEFAULT_OPENAI_MODEL

      const result = streamText({
        messages: convertToModelMessages(messages),
        model: openai(modelId),
        system,
      })

      return result.toUIMessageStreamResponse()
    } catch (error) {
      req.payload.logger.error(error, 'Error in chat endpoint: ')
      const message =
        error && typeof error === 'object' && 'message' in error
          ? (error as any).message
          : String(error)

      return new Response(JSON.stringify({ error: message }), {
        headers: { 'Content-Type': 'application/json' },
        status:
          message.includes('Authentication required') ||
          message.includes('Insufficient permissions')
            ? 401
            : 500,
      })
    }
  },
  method: 'post',
  path: PLUGIN_API_ENDPOINT_AGENT_CHAT,
})
