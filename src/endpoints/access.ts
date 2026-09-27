import type { PayloadRequest } from 'payload'

import { Forbidden, UnauthorizedError } from 'payload'

import type { PluginConfig } from '../types.js'

export const requireAuthentication = (req: PayloadRequest) => {
  if (!req.user) {
    throw new UnauthorizedError(req.t)
  }
}

export const checkGenerationAccess = async (req: PayloadRequest, config: PluginConfig) => {
  requireAuthentication(req)
  if (config.access?.generate && !(await config.access.generate({ req }))) {
    throw new Forbidden(req.t)
  }
}
