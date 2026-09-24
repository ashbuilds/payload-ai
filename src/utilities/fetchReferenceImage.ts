import { lookup } from 'node:dns/promises'
import { get as httpGet } from 'node:http'
import { get as httpsGet } from 'node:https'
import { isIP } from 'node:net'

const MAX_IMAGE_BYTES = 20 * 1024 * 1024
const TIMEOUT_MS = 30_000

// Permit globally routable destinations only. IPv4-mapped IPv6, NAT64, transition,
// documentation, multicast, loopback, link-local and private ranges are excluded.
export const isPublicAddress = (address: string): boolean => {
  if (isIP(address) === 4) {
    const [a, b, c] = address.split('.').map(Number)
    return !(
      a === 0 ||
      a === 10 ||
      a === 127 ||
      a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && (b === 168 || (b === 0 && (c === 0 || c === 2)) || (b === 88 && c === 99))) ||
      (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
      (a === 203 && b === 0 && c === 113)
    )
  }
  if (isIP(address) === 6) {
    const [first, second = '0'] = address.toLowerCase().split(':')
    const prefix = parseInt(first, 16)
    const subnet = parseInt(second || '0', 16)
    return (
      prefix >= 0x2000 &&
      prefix <= 0x3fff &&
      prefix !== 0x2002 &&
      prefix !== 0x3fff &&
      !(prefix === 0x2001 && (subnet < 0x200 || subnet === 0xdb8))
    )
  }
  return false
}

export const fetchReferenceImage = async (input: string, serverURL?: string) => {
  const url = new URL(input, serverURL || undefined)
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('Reference images must use HTTP(S) without URL credentials.')
  }
  const hostname = url.hostname.replace(/^\[|\]$/g, '')
  const controller = new AbortController()
  let timer: ReturnType<typeof setTimeout> | undefined
  // The deadline also covers DNS resolution, not just the connected socket.
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort()
      reject(new Error('Reference image request timed out.'))
    }, TIMEOUT_MS)
  })
  const download = async () => {
    const family = isIP(hostname)
    const addresses = family
      ? [{ address: hostname, family }]
      : await lookup(hostname, { all: true })
    if (controller.signal.aborted) {
      throw new Error('Reference image request timed out.')
    }
    if (!addresses.length || addresses.some(({ address }) => !isPublicAddress(address))) {
      throw new Error('Reference images must resolve only to public IP addresses.')
    }
    const selected = addresses[0]
    return new Promise<{ blob: Blob; url: string }>((resolve, reject) => {
      const get = url.protocol === 'https:' ? httpsGet : httpGet
      const request = get(
        url,
        {
          // Pin the validated address to prevent a second DNS lookup / DNS rebinding.
          // Keep the original hostname for Host and TLS certificate verification.
          agent: false,
          family: selected.family,
          lookup: (_hostname, options, callback) => {
            if (options.all) {
              callback(null, [selected])
            } else {
              callback(null, selected.address, selected.family)
            }
          },
          signal: controller.signal,
        },
        (response) => {
          // Redirects are intentionally rejected so they cannot escape validation.
          if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
            response.destroy()
            reject(new Error('Reference image server did not return a successful response.'))
            return
          }
          const declaredSize = Number(response.headers['content-length'])
          if (declaredSize > MAX_IMAGE_BYTES) {
            response.destroy()
            reject(new Error('Reference image exceeds the 20 MiB limit.'))
            return
          }
          const chunks: Buffer[] = []
          let size = 0
          response.on('data', (chunk: Buffer) => {
            size += chunk.length
            if (size > MAX_IMAGE_BYTES) {
              response.destroy(new Error('Reference image exceeds the 20 MiB limit.'))
              return
            }
            chunks.push(chunk)
          })
          response.on('error', reject)
          response.on('aborted', () =>
            reject(new Error('Reference image response was interrupted.')),
          )
          response.on('end', () =>
            resolve({
              blob: new Blob(chunks, { type: response.headers['content-type'] || '' }),
              url: url.href,
            }),
          )
        },
      )
      request.on('error', reject)
    })
  }
  try {
    return await Promise.race([download(), deadline])
  } finally {
    clearTimeout(timer)
  }
}
