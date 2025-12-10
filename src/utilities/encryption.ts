import crypto from 'crypto'

const algorithm = 'aes-256-cbc'
const ivLength = 16

export function encrypt(text: string, secret: string): string {
  if (!text) {return text}
  if (!secret) {throw new Error('No secret provided for encryption')}

  // Ensure secret is 32 bytes
  const key = crypto.createHash('sha256').update(secret).digest()
  const iv = crypto.randomBytes(ivLength)
  const cipher = crypto.createCipheriv(algorithm, key, iv)
  let encrypted = cipher.update(text)
  encrypted = Buffer.concat([encrypted, cipher.final()])
  return iv.toString('hex') + ':' + encrypted.toString('hex')
}

export function decrypt(text: string, secret: string): string {
  if (!text) {return text}
  if (!secret) {throw new Error('No secret provided for decryption')}

  try {
    const textParts = text.split(':')
    const iv = Buffer.from(textParts.shift()!, 'hex')
    const encryptedText = Buffer.from(textParts.join(':'), 'hex')
    const key = crypto.createHash('sha256').update(secret).digest()
    const decipher = crypto.createDecipheriv(algorithm, key, iv)
    let decrypted = decipher.update(encryptedText)
    decrypted = Buffer.concat([decrypted, decipher.final()])
    return decrypted.toString()
  } catch (e) {
    // If decryption fails, return original text (might be already plain or invalid)
    return text
  }
}
