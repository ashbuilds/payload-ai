import type { PayloadRequest } from 'payload'

import type { PluginConfig } from '../types.js'

const requireAuthentication = (req: PayloadRequest) => {
  if (!req.user) {
    throw new Error('Authentication required. Please log in to use AI features.')
  }
  return true
}

export const checkAccess = async (req: PayloadRequest, pluginConfig: PluginConfig) => {
  requireAuthentication(req)

  if (pluginConfig.access?.generate) {
    const hasAccess = await pluginConfig.access.generate({ req })
    if (!hasAccess) {
      throw new Error('Insufficient permissions to use AI generation features.')
    }
  }

  return true
}
