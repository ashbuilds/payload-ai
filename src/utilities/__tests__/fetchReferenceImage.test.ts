import { EventEmitter } from 'node:events'
import { PassThrough } from 'node:stream'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { fetchReferenceImage, isPublicAddress } from '../fetchReferenceImage.js'

const { get, lookup } = vi.hoisted(() => ({ get: vi.fn(), lookup: vi.fn() }))
vi.mock('node:dns/promises', () => ({ lookup }))
vi.mock('node:http', () => ({ get }))
vi.mock('node:https', () => ({ get }))

const serve = (
  { chunks = [Buffer.from('image')], headers = {}, status = 200 } = {} as {
    chunks?: Buffer[]
    headers?: Record<string, string>
    status?: number
  },
) => {
  get.mockImplementation((_url, options, callback) => {
    const req = new EventEmitter()
    options.signal.addEventListener('abort', () => req.emit('error', new Error('aborted')), {
      once: true,
    })
    queueMicrotask(() => {
      const response = Object.assign(new PassThrough(), { headers, statusCode: status })
      callback(response)
      for (const chunk of chunks) {
        if (response.destroyed) {
          break
        }
        response.write(chunk)
      }
      if (!response.destroyed) {
        response.end()
      }
    })
    return req
  })
}

beforeEach(() => {
  vi.resetAllMocks()
  lookup.mockResolvedValue([{ address: '93.184.216.34', family: 4 }])
  serve()
})
afterEach(() => {
  vi.useRealTimers()
})

describe('reference image network boundary', () => {
  it.each([
    '0.0.0.0',
    '10.1.2.3',
    '100.64.0.1',
    '127.0.0.1',
    '169.254.169.254',
    '172.16.0.1',
    '172.31.255.255',
    '192.168.0.1',
    '192.0.0.1',
    '192.0.2.1',
    '192.88.99.1',
    '198.18.0.1',
    '198.19.0.1',
    '198.51.100.1',
    '203.0.113.1',
    '224.0.0.1',
    '255.255.255.255',
    '::',
    '::1',
    '::ffff:127.0.0.1',
    '::ffff:7f00:1',
    'fc00::1',
    'fd00::1',
    'fe80::1',
    'ff02::1',
    '64:ff9b::7f00:1',
    '2001::1',
    '2001:db8::1',
    '2002:7f00:1::',
    '3fff::1',
  ])('rejects non-public address %s', (address) => {
    expect(isPublicAddress(address)).toBe(false)
  })

  it.each(['93.184.216.34', '1.1.1.1', '2606:4700:4700::1111', '2001:4860:4860::8888'])(
    'permits public address %s',
    (address) => {
      expect(isPublicAddress(address)).toBe(true)
    },
  )

  it.each([
    'http://127.0.0.1/a.png',
    'http://2130706433/a.png',
    'http://0x7f000001/a.png',
    'http://[::1]/a.png',
    'http://[::ffff:127.0.0.1]/a.png',
    'file:///tmp/a.png',
    'ftp://example.com/a.png',
    'https://user:secret@example.com/a.png',
  ])('does not connect to unsafe URL %s', async (url) => {
    await expect(fetchReferenceImage(url)).rejects.toThrow()
    expect(get).not.toHaveBeenCalled()
  })

  it('rejects a hostname resolving to a mix of public and private addresses', async () => {
    lookup.mockResolvedValue([
      { address: '93.184.216.34', family: 4 },
      { address: '10.0.0.1', family: 4 },
    ])
    await expect(fetchReferenceImage('https://images.example/a.png')).rejects.toThrow('public IP')
    expect(get).not.toHaveBeenCalled()
  })

  it('pins the validated DNS answer and sends no credentials', async () => {
    const result = await fetchReferenceImage('/a.png', 'https://images.example')
    expect(await result.blob.text()).toBe('image')
    const [url, options] = get.mock.calls[0]
    expect(url.href).toBe('https://images.example/a.png')
    expect(options.headers).toBeUndefined()
    expect(options.agent).toBe(false)
    const callback = vi.fn()
    options.lookup('images.example', {}, callback)
    expect(callback).toHaveBeenCalledWith(null, '93.184.216.34', 4)
    const allCallback = vi.fn()
    options.lookup('images.example', { all: true }, allCallback)
    expect(allCallback).toHaveBeenCalledWith(null, [{ address: '93.184.216.34', family: 4 }])
    expect(lookup).toHaveBeenCalledTimes(1)
  })

  it('supports a public IPv6 literal without DNS', async () => {
    await fetchReferenceImage('https://[2606:4700:4700::1111]/a.png')
    expect(lookup).not.toHaveBeenCalled()
    expect(get.mock.calls[0][1].family).toBe(6)
  })

  it.each([301, 302, 307, 308, 404, 500])(
    'rejects response status %s without following redirects',
    async (status) => {
      serve({ headers: { location: 'http://127.0.0.1/private' }, status })
      await expect(fetchReferenceImage('https://images.example/a.png')).rejects.toThrow(
        'successful response',
      )
      expect(get).toHaveBeenCalledTimes(1)
    },
  )

  it('rejects oversized Content-Length before reading the body', async () => {
    serve({ headers: { 'content-length': String(21 * 1024 * 1024) } })
    await expect(fetchReferenceImage('https://images.example/a.png')).rejects.toThrow('20 MiB')
  })

  it('bounds streamed bodies even without Content-Length', async () => {
    serve({ chunks: [Buffer.alloc(20 * 1024 * 1024), Buffer.from('overflow')] })
    await expect(fetchReferenceImage('https://images.example/a.png')).rejects.toThrow()
  })

  it('times out stalled DNS without initiating a request', async () => {
    vi.useFakeTimers()
    lookup.mockReturnValue(new Promise(() => {}))
    const result = expect(fetchReferenceImage('https://images.example/a.png')).rejects.toThrow(
      'timed out',
    )
    await vi.advanceTimersByTimeAsync(30_000)
    await result
    expect(get).not.toHaveBeenCalled()
  })

  it('cancels stalled requests at the deadline', async () => {
    vi.useFakeTimers()
    get.mockImplementation((_url, options) => {
      const req = new EventEmitter()
      options.signal.addEventListener('abort', () => req.emit('error', new Error('aborted')))
      return req
    })
    const result = expect(fetchReferenceImage('https://images.example/a.png')).rejects.toThrow()
    await vi.advanceTimersByTimeAsync(30_000)
    await result
    expect(get.mock.calls[0][1].signal.aborted).toBe(true)
  })
})
