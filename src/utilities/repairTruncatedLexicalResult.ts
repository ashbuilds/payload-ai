/**
 * How many trailing nodes may be dropped while repairing. A generation cut off by the output token
 * limit leaves one unusable node behind; a result that needs more than a few nodes removed is
 * broken for another reason and must not be silently trimmed down to whatever validates.
 */
const MAX_DROPPED_NODES = 3

/**
 * Repairs a final generation result that a cut-off response left invalid.
 *
 * The response stops mid-node, so the last node is incomplete in a way no structural check can
 * detect: it can carry a perfectly valid `type` and still miss properties the schema requires.
 * The validator does know, so trailing nodes are dropped one at a time until it accepts the
 * result - which also guarantees that whatever is returned here is valid.
 *
 * The value is passed on untouched apart from the removed nodes. Normalizing it first would be
 * fatal: the generation schema sets `additionalProperties: false` on every node, so a single
 * added property invalidates the result no matter how much is dropped.
 *
 * Returns null when dropping trailing nodes does not lead to a valid result, meaning the value is
 * unusable for a reason other than the truncated tail.
 */
export const repairTruncatedLexicalResult = (
  state: unknown,
  validate: (value: unknown) => boolean,
) => {
  if (!state || typeof state !== 'object' || !('root' in state)) {
    return null
  }

  const root = (state as { root?: unknown }).root

  if (!root || typeof root !== 'object' || !Array.isArray((root as { children?: unknown }).children)) {
    return null
  }

  const children = [...(root as { children: unknown[] }).children]

  // Never empties the document: a result without a single usable node is not a repair.
  for (let dropped = 0; dropped < MAX_DROPPED_NODES && children.length > 1; dropped++) {
    children.pop()

    const candidate = { ...state, root: { ...root, children: [...children] } }

    if (validate(candidate)) {
      return candidate
    }
  }

  return null
}
