import type { ClientCollectionConfig, CollectionConfig, Field } from 'payload'

type AnyCollectionConfig = ClientCollectionConfig | CollectionConfig

/**
 * Resolve a Payload field definition by a full schemaPath like:
 *   "{collectionSlug}.fieldA.subFieldB.blockSlug.innerField"
 *
 * Notes:
 * - Tabs are a UI construct and are not part of schemaPath (fields inside tabs are at the same level).
 * - Blocks include the block slug as part of the path (we must consume it between the block field and its inner fields).
 * - Rows are skipped by this plugin&#39;s schema path mapping; support added defensively.
 */
export const getFieldBySchemaPath = (
  collectionConfig: AnyCollectionConfig,
  schemaPath: string,
): Field | null => {
  if (!collectionConfig || !schemaPath) {
    return null
  }

  const parts = schemaPath.split('.')
  if (!parts.length) {
    return null
  }

  // Strip the collection slug prefix if present
  const [collectionSlug, ...rest] = parts
  const pathParts =
    collectionSlug === collectionConfig.slug ? rest.filter(Boolean) : parts.filter(Boolean)

  if (!pathParts.length) {
    return null
  }

  const findInFields = (fields: Field[], segments: string[]): Field | null => {
    if (!segments.length) {
      return null
    }

    const [current, ...remaining] = segments

    // First, try to match a field by name
    for (const field of fields) {
      // Tabs do not contribute to path segments; search inside all tabs with the same segments
      if ((field as any).tabs) {
        const tabs = (field as any).tabs as Array<{ fields?: Field[] }>
        for (const tab of tabs) {
          const foundInTab =
            tab.fields && tab.fields.length ? findInFields(tab.fields, segments) : null
          if (foundInTab) {
            return foundInTab
          }
        }
      }

      if ((field as any).name === current) {
        // If this is the last segment, we found the target field
        if (remaining.length === 0) {
          return field
        }

        // Recurse into composite field types
        if ((field as any).fields && Array.isArray((field as any).fields)) {
          const found = findInFields((field as any).fields, remaining)
          if (found) {
            return found
          }
        }

        if ((field as any).blocks && Array.isArray((field as any).blocks)) {
          // Next segment should be a block slug, then continue into block fields
          if (!remaining.length) {
            return field
          } // path stops at block container (unlikely for our mapping)
          const [blockSlug, ...afterBlock] = remaining
          const blocks = (field as any).blocks as Array<{ fields: Field[]; slug: string }>
          const block = blocks.find((b) => b.slug === blockSlug)
          if (block) {
            const found = findInFields(block.fields, afterBlock)
            if (found) {
              return found
            }
          }
        }
      }
    }

    // Not found at this level
    return null
  }

  const rootFields = (collectionConfig as any).fields as Field[] | undefined
  if (!rootFields || !Array.isArray(rootFields)) {
    return null
  }

  return findInFields(rootFields, pathParts)
}
