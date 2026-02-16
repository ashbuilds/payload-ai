import { createServerFeature } from '@payloadcms/richtext-lexical'

// Mock the node for server-side usage to avoid import issues with the library
const BeautifulMentionNode = {
  clone: (node: any) => ({ ...node }),
  getType: () => 'beautifulMention',
  importJSON: (serializedNode: any) => {
    // Return a basic object that satisfies the lexical node interface purely for server validation
    return {
      ...serializedNode,
      exportJSON: () => serializedNode,
      getType: () => 'beautifulMention',
    }
  },
}

export const PromptMentionsFeature = createServerFeature({
  feature: {
    ClientFeature: '@ai-stack/payloadcms/fields#PromptMentionsClient',
    nodes: [
      {
        converters: {},
        node: BeautifulMentionNode,
      },
    ],
  },
  key: 'promptMentions',
})
