import type { Endpoint, PayloadRequest } from 'payload'

import type { PluginConfig } from '../types.js'

import { PLUGIN_REINIT_ENDPOINT, PLUGIN_SETTINGS_GLOBAL } from '../defaults.js'
import { init } from '../init.js'
import { updateFieldsConfig } from '../utilities/updateFieldsConfig.js'

export const reinit: (config: PluginConfig) => Endpoint = (config) => {
  const { access } = config

  return {
    handler: async (req: PayloadRequest) => {
      try {
        // Access control: require settings permission (defaults to authenticated users)
        let isAllowed = !!req.user
        if (access?.settings) {
          try {
            isAllowed = await access.settings({ req })
          } catch (e) {
            req.payload.logger.error(e, 'AI Plugin: Error while checking access.settings')
            isAllowed = !!req.user
          }
        }

        if (!isAllowed) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            headers: { 'Content-Type': 'application/json' },
            status: 401,
          })
        }

        // Resolve enabled collections from Global settings
        let enabledSlugs: string[] = []
        try {
          const settings: any = await req.payload.findGlobal({ slug: PLUGIN_SETTINGS_GLOBAL })
          if (Array.isArray(settings?.collections)) {
            enabledSlugs = settings.collections
              .filter((c: any) => c?.enabled && typeof c?.slug === 'string')
              .map((c: any) => c.slug)
          }
        } catch (e) {
          // ignore; fall back to plugin defaults below
        }

        // Fallback to build-time plugin config if no globals set yet
        if (!enabledSlugs.length && config.collections) {
          enabledSlugs = Object.keys(config.collections).filter((slug) => !!config.collections[slug])
        }

        // Build schemaPathMap by scanning current config collections
        let schemaPathMap: Record<string, any> = {}
        for (const collection of req.payload.config.collections || []) {
          if (enabledSlugs.includes(collection.slug)) {
            const { schemaPathMap: mapForCollection } = updateFieldsConfig(collection)
            schemaPathMap = {
              ...schemaPathMap,
              ...mapForCollection,
            }
          }
        }

        // Run initialization to ensure Instructions docs exist for enabled collections/fields
        await init(req.payload, schemaPathMap, config)

        return Response.json({
          ok: true,
          enabledCollections: enabledSlugs,
          initializedCount: Object.keys(schemaPathMap).length,
        })
      } catch (error) {
        req.payload.logger.error(error, 'AI Plugin: Reinit failed')
        const message =
          error && typeof error === 'object' && 'message' in error
            ? (error as any).message
            : String(error)
        return new Response(JSON.stringify({ error: message }), {
          headers: { 'Content-Type': 'application/json' },
          status: 500,
        })
      }
    },
    method: 'post',
    path: PLUGIN_REINIT_ENDPOINT,
  }
}
