/**
 * Maps Lexical node type values to JSON schema definition names.
 * This is used to filter the editor schema based on allowed editor nodes.
 *
 * The keys are the type values that appear in serialized Lexical JSON (e.g., 'heading', 'paragraph').
 * The values are the schema definition names as defined in lexicalJsonSchema.ts.
 */
export const nodeTypeToSchemaMap: Record<string, string> = {
  // Core nodes (typically always included)
  text: 'TextNode',
  linebreak: 'LineBreakNode',
  tab: 'TabNode',
  root: 'RootNode',

  // Block nodes
  paragraph: 'ParagraphNode',
  heading: 'HeadingNode',
  quote: 'QuoteNode',
  list: 'ListNode',
  listitem: 'ListItemNode',

  // Rich content nodes
  link: 'LinkNode',
  code: 'CodeNode',
  horizontalrule: 'HorizontalRuleNode',

  // Table nodes
  table: 'TableNode',
  tablerow: 'TableRowNode',
  tablecell: 'TableCellNode',

  // Media nodes
  image: 'ImageNode',
}

/**
 * Core nodes that should always be included in the filtered schema
 */
export const coreNodeTypes = ['text', 'linebreak', 'tab', 'root', 'paragraph']

/**
 * Converts a Lexical node class name (e.g., 'HeadingNode') to its type value (e.g., 'heading').
 * This handles the common pattern where node classes are named with the pattern `{Type}Node`.
 */
export function nodeClassToType(nodeClassName: string): string {
  // Handle common formats:
  // 'HeadingNode' -> 'heading'
  // 'ParagraphNode' -> 'paragraph'
  // 'HorizontalRuleNode' -> 'horizontalrule'
  return nodeClassName.replace(/Node$/, '').toLowerCase()
}

/**
 * Converts a set of Lexical node class names to their corresponding schema definition names.
 * Includes core nodes automatically.
 */
export function nodeClassesToSchemaDefinitions(nodeClassNames: string[]): string[] {
  const definitions = new Set<string>()

  // Always include core nodes
  for (const coreType of coreNodeTypes) {
    const def = nodeTypeToSchemaMap[coreType]
    if (def) {
      definitions.add(def)
    }
  }

  // Convert each node class to its definition
  for (const className of nodeClassNames) {
    const type = nodeClassToType(className)
    const def = nodeTypeToSchemaMap[type]
    if (def) {
      definitions.add(def)
    }
  }

  return Array.from(definitions)
}
