import type { SerializedEditorState } from 'lexical'

import { getFieldInfo } from '../../utilities/getFieldInfo.js'
import { lexicalToHTML } from '../../utilities/lexicalToHTML.js'
import { asyncHandlebars } from './asyncHandlebars.js'
import { handlebarsHelpersMap } from './helpersMap.js'

export const registerEditorHelper = (payload: any, schemaPath: string) => {
  //TODO: add autocomplete ability using handlebars template on PromptEditorField and include custom helpers in dropdown

  const schemaPathChunks = schemaPath.split('.')

  asyncHandlebars.registerHelper(
    handlebarsHelpersMap.toHTML.name,
    async function (content: SerializedEditorState, options: any) {
      const collectionSlug = schemaPathChunks[0]
      const { ids } = options
      const requestedPath =
        Array.isArray(ids) && ids.length > 0 ? `${collectionSlug}.${ids.join('.')}` : schemaPath
      const fieldInfo =
        getFieldInfo(payload.collections, requestedPath) ?? getFieldInfo(payload.collections, schemaPath)

      let html = ''
      if (
        fieldInfo &&
        'editor' in fieldInfo &&
        fieldInfo.editor &&
        typeof fieldInfo.editor === 'object' &&
        'editorConfig' in fieldInfo.editor &&
        fieldInfo.editor.editorConfig
      ) {
        if (
          fieldInfo.editor.editorConfig &&
          typeof fieldInfo.editor.editorConfig === 'object' &&
          'features' in fieldInfo.editor.editorConfig &&
          'lexical' in fieldInfo.editor.editorConfig &&
          'resolvedFeatureMap' in fieldInfo.editor.editorConfig
        ) {
          html = await lexicalToHTML(
            content,
            fieldInfo.editor.editorConfig as any, // as SanitizedServerEditorConfig
          )
        }
      }
      return new asyncHandlebars.SafeString(html)
    },
  )
}
