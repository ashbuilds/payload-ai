import type { PayloadRequest } from 'payload'

import { APIError } from 'payload'

import type { PluginConfig } from '../types.js'

export const requireAuthentication = (req: PayloadRequest) => {
  if (!req.user) {
    throw new APIError('Authentication required. Please log in to use AI features.', 401)
  }
}

export const checkGenerationAccess = async (req: PayloadRequest, config: PluginConfig) => {
  requireAuthentication(req)
  if (config.access?.generate && !(await config.access.generate({ req }))) {
    throw new APIError('Insufficient permissions to use AI generation features.', 403)
  }
}

export const endpointErrorResponse = (error: unknown) => {
  const status =
    error instanceof APIError && error.status >= 400 && error.status < 500 ? error.status : 500
  return Response.json(
    { error: status === 500 ? 'Unable to complete the AI request.' : (error as APIError).message },
    { status },
  )
}
