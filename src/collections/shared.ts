/**
 * Shared collection defaults for plugin-internal collections.
 * Used by AIJobs and Instructions to avoid duplicating access/admin config.
 */
export const pluginCollectionAccess = {
  create: ({ req }: { req: { user?: unknown } }) => !!req.user,
  delete: ({ req }: { req: { user?: unknown } }) => !!req.user,
  read: ({ req }: { req: { user?: unknown } }) => !!req.user,
  update: ({ req }: { req: { user?: unknown } }) => !!req.user,
}

export const pluginCollectionAdmin = {
  group: 'Plugins',
  hidden: true,
}
