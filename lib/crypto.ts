import crypto from 'crypto'

const ALGO = 'aes-256-gcm'

export function encrypt(text: string, secret: string) {
  const iv = crypto.randomBytes(12)
  const key = crypto.createHash('sha256').update(secret).digest()
  const cipher = crypto.createCipheriv(ALGO, key, iv)
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, encrypted]).toString('base64')
}

export function decrypt(data: string, secret: string) {
  const b = Buffer.from(data, 'base64')
  const iv = b.slice(0, 12)
  const tag = b.slice(12, 28)
  const text = b.slice(28)
  const key = crypto.createHash('sha256').update(secret).digest()
  const decipher = crypto.createDecipheriv(ALGO, key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(text), decipher.final()]).toString('utf8')
}
