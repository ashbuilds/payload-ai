import crypto from 'crypto'

const algorithm = 'aes-256-cbc'
const ivLength = 16

export function encrypt(text: string, secret: string): string {
  if (!text) {
    return text
  }
  if (!secret) {
    throw new Error('No secret provided for encryption')
  }

  // Cloudflare Workers' Node compatibility can require explicit UTF-8 handling.
  const key = crypto.createHash('sha256').update(String(secret), 'utf8').digest()
  const iv = crypto.randomBytes(ivLength)
  const cipher = crypto.createCipheriv(algorithm, key, iv)
  let encrypted = cipher.update(Buffer.from(String(text), 'utf8'))
  encrypted = Buffer.concat([encrypted, cipher.final()])

  return `${iv.toString('hex')}:${encrypted.toString('hex')}`
}

export function decrypt(text: string, secret: string): string {
  if (!text) {
    return text
  }
  if (!secret) {
    throw new Error('No secret provided for decryption')
  }

  try {
    const textParts = text.split(':')
    const ivHex = textParts.shift()
    if (!ivHex) {
      return text
    }

    const iv = Buffer.from(ivHex, 'hex')
    if (iv.length !== ivLength) {
      return text
    }

    const encryptedText = Buffer.from(textParts.join(':'), 'hex')
    const key = crypto.createHash('sha256').update(String(secret), 'utf8').digest()
    const decipher = crypto.createDecipheriv(algorithm, key, iv)
    let decrypted = decipher.update(encryptedText)
    decrypted = Buffer.concat([decrypted, decipher.final()])

    return decrypted.toString('utf8')
  } catch (_error) {
    // If decryption fails, return original text (might be already plain or invalid)
    return text
  }
}
