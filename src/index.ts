export type { GenerateArgs } from './ai/index.js'

export { defaultPrompts } from './ai/prompts.js'

export { PayloadAiPluginLexicalEditorFeature } from './fields/LexicalEditor/feature.server.js'
// Re-export to ensure payload.ai module augmentation is included
export type {} from './payload-ai.d.ts'

export { payloadAiPlugin } from './plugin.js'
export { fieldToJsonSchema } from './utilities/fieldToJsonSchema.js'
