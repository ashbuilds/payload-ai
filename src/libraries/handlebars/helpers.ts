import type { SerializedEditorState } from 'lexical'

import { getFieldInfo } from '../../utilities/getFieldInfo.js'
import { lexicalToHTML } from '../../utilities/lexicalToHTML.js'
import { asyncHandlebars } from './asyncHandlebars.js'
import { handlebarsHelpersMap } from './helpersMap.js'

export const registerEditorHelper = (payload: any, schemaPath: string) => {
  //TODO: add autocomplete ability using handlebars template on PromptEditorField and include custom helpers in dropdown

  let fieldInfo = getFieldInfo(payload.collections, schemaPath)
  const schemaPathChunks = schemaPath.split('.')

  asyncHandlebars.registerHelper(
    handlebarsHelpersMap.toHTML.name,
    async function (content: SerializedEditorState, options: any) {
      const collectionSlug = schemaPathChunks[0]
      const { ids } = options
      for (const id of ids) {
        //TODO: Find a better way to get schemaPath of defined field in prompt editor
        const path = `${collectionSlug}.${id}`
        fieldInfo = getFieldInfo(payload.collections, path)
      }

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
