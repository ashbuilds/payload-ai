import type { PayloadRequest } from 'payload'

import { PLUGIN_SERVER_URL_ENV_KEYS } from '../../defaults.js'

const normalizeServerURL = (value: string | undefined): string | undefined => {
  if (!value) {
    return undefined
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return undefined
  }

  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return undefined
    }

    const normalizedPath = parsed.pathname === '/' ? '' : parsed.pathname.replace(/\/+$/, '')
    return `${parsed.origin}${normalizedPath}`
  } catch {
    return undefined
  }
}

const getProcessEnvValue = (key: string): string | undefined => {
  if (typeof process === 'undefined' || !process.env) {
    return undefined
  }

  const value = process.env[key]
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

const getHeaderOrigin = (req: PayloadRequest): string | undefined => {
  const forwardedProto = req.headers.get('x-forwarded-proto')?.split(',')[0]?.trim()
  const forwardedHost = req.headers.get('x-forwarded-host')?.split(',')[0]?.trim()

  if (forwardedProto && forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`
  }

  const host = req.headers.get('host')?.trim()
  if (!host) {
    return undefined
  }

  return `https://${host}`
}

export function resolveServerURL(req: PayloadRequest): string | undefined {
  const candidates: Array<string | undefined> = [
    req.payload.config?.serverURL || undefined,
    ...PLUGIN_SERVER_URL_ENV_KEYS.map((key) => getProcessEnvValue(key)),
    req.url,
    getHeaderOrigin(req),
  ]

  for (const candidate of candidates) {
    const normalized = normalizeServerURL(candidate)
    if (normalized) {
      return normalized
    }
  }

  return undefined
}

export function resolveAbsoluteURL(input: string, req: PayloadRequest): string {
  if (/^https?:\/\//i.test(input)) {
    return input
  }

  const baseURL = resolveServerURL(req)
  if (!baseURL) {
    throw new Error(
      'Could not resolve a server URL for relative asset path. Set `payload.config.serverURL` or SERVER_URL.',
    )
  }

  const normalizedPath = input.startsWith('/') ? input : `/${input}`
  return `${baseURL}${normalizedPath}`
}
