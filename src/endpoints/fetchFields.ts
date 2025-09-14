import type { Endpoint, PayloadRequest } from 'payload'

import type { PluginConfig, SerializedPromptField } from '../types.js'

import { PLUGIN_FETCH_FIELDS_ENDPOINT, PLUGIN_INSTRUCTIONS_TABLE, PLUGIN_SETTINGS_GLOBAL } from '../defaults.js'

export const fetchFields: (config: PluginConfig) => Endpoint = (
  config
) => {
  const {access, options = {}, promptFields = []} = config
  return {
    handler: async (req: PayloadRequest) => {
      const { docs = [] } = await req.payload.find({
        collection: PLUGIN_INSTRUCTIONS_TABLE,
        pagination: false,
      })

      // Load site-wide settings to pick enabledLanguages from Global if available
      let enabledLanguagesFromGlobal: string[] | undefined
      try {
        const settings: any = await req.payload.findGlobal({ slug: PLUGIN_SETTINGS_GLOBAL })
        const langs = Array.isArray(settings?.enabledLanguages)
          ? settings.enabledLanguages
              .map((l: any) => (typeof l === 'string' ? l : l?.code))
              .filter(Boolean)
          : undefined
        enabledLanguagesFromGlobal = langs
      } catch (e) {
        // ignore missing global or access errors
      }

      // Resolve enabled collections from Global (fallback to plugin config)
      let enabledCollectionsFromGlobal: string[] | undefined
      try {
        const settings: any = await req.payload.findGlobal({ slug: PLUGIN_SETTINGS_GLOBAL })
        if (Array.isArray(settings?.collections)) {
          enabledCollectionsFromGlobal = settings.collections
            .filter((c: any) => c?.enabled && typeof c?.slug === 'string')
            .map((c: any) => c.slug)
        }
      } catch (e) {
        // ignore
      }
      const enabledCollectionsFromConfig =
        config && config.collections
          ? Object.keys(config.collections).filter((slug) => !!(config as any).collections[slug])
          : []
      const enabledCollections =
        enabledCollectionsFromGlobal && enabledCollectionsFromGlobal.length
          ? enabledCollectionsFromGlobal
          : enabledCollectionsFromConfig

      let isConfigAllowed = true // Users allowed to update prompts by default

      if (access?.settings) {
        try {
          isConfigAllowed = await access.settings({ req })
        } catch (e) {
          req.payload.logger.error(req, 'Please check your "access.settings" for request')
        }
      }

      const fieldMap: Record<string, { fieldType: any; id: any }> = {}
      docs.forEach((doc) => {
        fieldMap[doc['schema-path']] = {
          id: doc.id,
          fieldType: doc['field-type'],
        }
      })

      return Response.json({
        ...options,
        enabledCollections,
        enabledLanguages: enabledLanguagesFromGlobal ?? options.enabledLanguages,
        fields: fieldMap,
        isConfigAllowed,
        promptFields: promptFields.map(({ getter: _getter, ...field }): SerializedPromptField => {
          return field
        }),
      })
    },
    method: 'get',
    path: PLUGIN_FETCH_FIELDS_ENDPOINT,
  }
}
