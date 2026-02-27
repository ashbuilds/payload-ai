interface ScopeFrame {
  scopeVar?: string
  type: 'each' | 'if' | 'unless' | 'with'
}

const RESERVED_VALUES = new Set(['blank', 'empty', 'false', 'nil', 'null', 'true'])
const PATH_PATTERN = /^[A-Za-z_][\w-]*(?:\.[A-Za-z0-9_-]+)*$/
const TOKEN_PATTERN = /(?:\.\.\/)*[@A-Za-z_][\w@./-]*/g

const normalizeNestedTemplateBraces = (template: string): string => {
  return template.replace(/(\{\{[^{}]*)\{\{([^}]+)\}\}(.*?\}\})/g, '$1$2$3')
}

const sanitizeLegacyFieldMentions = (template: string): string => {
  return template.replace(
    /\{\{\s*#\s*(?!if\b|unless\b|each\b|with\b)([\w.-]+)\s*\}\}/g,
    '{{ $1 }}',
  )
}

const splitOutsideQuotes = (
  value: string,
  transformChunk: (chunk: string) => string,
): string => {
  let output = ''
  let current = ''
  let quote: '"' | "'" | null = null

  for (let i = 0; i < value.length; i++) {
    const char = value[i]

    if (quote) {
      current += char
      if (char === quote && value[i - 1] !== '\\') {
        quote = null
      }
      continue
    }

    if (char === '"' || char === "'") {
      output += transformChunk(current)
      current = char
      quote = char
      continue
    }

    current += char
  }

  output += transformChunk(current)
  return output
}

const resolveScopeFrame = (frames: ScopeFrame[], parentDepth = 0): ScopeFrame | undefined => {
  const offset = Math.max(frames.length - parentDepth, 0)
  for (let i = offset - 1; i >= 0; i--) {
    const frame = frames[i]
    if (frame.scopeVar) {
      return frame
    }
  }
  return undefined
}

const extractParentDepth = (expression: string): { depth: number; value: string } => {
  let depth = 0
  let value = expression

  while (value.startsWith('../')) {
    depth += 1
    value = value.slice(3)
  }

  return { depth, value }
}

const mapSpecialLoopTokens = (expression: string, frame: ScopeFrame | undefined): string => {
  if (!frame?.scopeVar || frame.type !== 'each') {
    return expression
  }

  if (expression === '.' || expression === 'this') {
    return frame.scopeVar
  }

  if (expression.startsWith('this.')) {
    return `${frame.scopeVar}.${expression.slice(5)}`
  }

  if (expression === '@index') {
    return 'forloop.index0'
  }

  if (expression === '@first') {
    return 'forloop.first'
  }

  if (expression === '@last') {
    return 'forloop.last'
  }

  return expression
}

const shouldPrefixWithScope = (expression: string): boolean => {
  if (!PATH_PATTERN.test(expression)) {
    return false
  }

  if (RESERVED_VALUES.has(expression)) {
    return false
  }

  return true
}

const transformSimpleExpression = (expression: string, frames: ScopeFrame[]): string => {
  const trimmed = expression.trim()
  if (!trimmed) {
    return trimmed
  }

  const { depth, value } = extractParentDepth(trimmed)
  const scopedFrame = resolveScopeFrame(frames, depth)
  const mapped = mapSpecialLoopTokens(value, scopedFrame)

  if (!scopedFrame?.scopeVar) {
    return mapped
  }

  if (mapped.startsWith('forloop.')) {
    return mapped
  }

  if (mapped.startsWith(`${scopedFrame.scopeVar}.`) || mapped === scopedFrame.scopeVar) {
    return mapped
  }

  if (!shouldPrefixWithScope(mapped)) {
    return mapped
  }

  return `${scopedFrame.scopeVar}.${mapped}`
}

const transformConditionExpression = (expression: string, frames: ScopeFrame[]): string => {
  const operatorNormalized = expression
    .replace(/!==/g, '!=')
    .replace(/===/g, '==')
    .replace(/&&/g, ' and ')
    .replace(/\|\|/g, ' or ')

  return splitOutsideQuotes(operatorNormalized, (chunk) => {
    return chunk.replace(TOKEN_PATTERN, (token) => {
      if (RESERVED_VALUES.has(token)) {
        return token
      }

      if (token === 'and' || token === 'or' || token === 'contains') {
        return token
      }

      return transformSimpleExpression(token, frames)
    })
  })
}

const rewriteOutputExpressions = (segment: string, frames: ScopeFrame[]): string => {
  return segment.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_full, expression: string) => {
    const trimmed = expression.trim()

    if (trimmed.startsWith('toHTML ')) {
      const fieldExpression = trimmed.slice('toHTML'.length).trim()
      const transformed = transformSimpleExpression(fieldExpression, frames)
      const escapedFieldExpression = fieldExpression.replace(/'/g, "\\'")
      return `{{ ${transformed} | toHTML: '${escapedFieldExpression}' }}`
    }

    if (trimmed.startsWith('toText ')) {
      const fieldExpression = trimmed.slice('toText'.length).trim()
      const transformed = transformSimpleExpression(fieldExpression, frames)
      return `{{ ${transformed} }}`
    }

    const transformedExpression = transformSimpleExpression(trimmed, frames)
    return `{{ ${transformedExpression} }}`
  })
}

const closeFrame = (frame: ScopeFrame): string => {
  switch (frame.type) {
    case 'each':
      return '{% endfor %}'
    case 'if':
      return '{% endif %}'
    case 'unless':
      return '{% endunless %}'
    case 'with':
      return '{% endif %}'
    default:
      return ''
  }
}

const convertBlockTag = (
  marker: '#' | '/',
  keyword: string,
  rawExpression: string,
  frames: ScopeFrame[],
  counters: { each: number; with: number },
): string | null => {
  if (marker === '#') {
    if (keyword === 'if') {
      const expression = transformConditionExpression(rawExpression.trim(), frames)
      frames.push({ type: 'if' })
      return `{% if ${expression} %}`
    }

    if (keyword === 'unless') {
      const expression = transformConditionExpression(rawExpression.trim(), frames)
      frames.push({ type: 'unless' })
      return `{% unless ${expression} %}`
    }

    if (keyword === 'each') {
      const expression = transformConditionExpression(rawExpression.trim(), frames)
      const itemVar = `__item${counters.each++}`
      frames.push({ type: 'each', scopeVar: itemVar })
      return `{% for ${itemVar} in ${expression} %}`
    }

    if (keyword === 'with') {
      const expression = transformConditionExpression(rawExpression.trim(), frames)
      const withVar = `__with${counters.with++}`
      frames.push({ type: 'with', scopeVar: withVar })
      return `{% assign ${withVar} = ${expression} %}{% if ${withVar} %}`
    }

    return null
  }

  const closingIndex = [...frames].reverse().findIndex((frame) => frame.type === keyword)
  if (closingIndex === -1) {
    return null
  }

  const frameIndex = frames.length - 1 - closingIndex
  const [frame] = frames.splice(frameIndex, 1)
  return closeFrame(frame)
}

export const convertLegacyTemplateToLiquid = (template: string): string => {
  if (!template) {
    return ''
  }

  const preprocessed = sanitizeLegacyFieldMentions(normalizeNestedTemplateBraces(template))
  const blockPattern =
    /\{\{\s*(#|\/)\s*(if|unless|each|with)\s*([^}]*)\}\}|\{\{\s*else(?:\s+if\s+([^}]+))?\s*\}\}/g

  const frames: ScopeFrame[] = []
  const counters = { each: 0, with: 0 }

  let output = ''
  let cursor = 0

  for (let match = blockPattern.exec(preprocessed); match; match = blockPattern.exec(preprocessed)) {
    const [fullMatch, marker, keyword, rawExpression = '', elseIfExpression = ''] = match
    const segment = preprocessed.slice(cursor, match.index)
    output += rewriteOutputExpressions(segment, frames)

    if (marker && keyword) {
      const converted = convertBlockTag(
        marker as '#' | '/',
        keyword,
        rawExpression,
        frames,
        counters,
      )
      output += converted ?? fullMatch
      cursor = match.index + fullMatch.length
      continue
    }

    const topFrame = frames[frames.length - 1]
    if (!topFrame) {
      output += fullMatch
      cursor = match.index + fullMatch.length
      continue
    }

    if (elseIfExpression) {
      const condition = transformConditionExpression(elseIfExpression.trim(), frames)
      if (topFrame.type === 'if') {
        output += `{% elsif ${condition} %}`
      } else {
        output += `{% else %}{% if ${condition} %}`
        frames.push({ type: 'if' })
      }
      cursor = match.index + fullMatch.length
      continue
    }

    output += '{% else %}'
    cursor = match.index + fullMatch.length
  }

  output += rewriteOutputExpressions(preprocessed.slice(cursor), frames)

  return output
}

export const convertLiquidTemplateToLegacySuggestions = (value: string): string => {
  if (!value) {
    return value
  }

  return value.replace(/\{\{\s*([^}|]+?)\s*\|\s*toHTML(?::\s*'([^']+)')?\s*\}\}/g, (_, lhs, rhs) => {
    return `{{toHTML ${(rhs || lhs).trim()}}}`
  })
}

export const isLegacyBlockExpression = (value: string): boolean => {
  return /\{\{\s*#\s*(if|unless|each|with)\b/.test(value)
}

export const isLiquidBlockExpression = (value: string): boolean => {
  return /\{\%\s*(if|unless|for)\b/.test(value)
}

export const usesLegacyToHTMLHelper = (value: string): boolean => {
  return /\{\{\s*toHTML\s+[^}]+\}\}/.test(value)
}
