import crypto from 'crypto'
import { getEncryptionKey } from './encryption'

const ALGO = 'aes-256-gcm'

function deriveKey(secret?: string) {
  const s = secret || getEncryptionKey()
  return crypto.createHash('sha256').update(s).digest()
}

export function encrypt(text: string, secret?: string) {
  const iv = crypto.randomBytes(12)
  const key = deriveKey(secret)
  const cipher = crypto.createCipheriv(ALGO, key, iv)
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, encrypted]).toString('base64')
}

export function decrypt(data: string, secret?: string) {
  const b = Buffer.from(data, 'base64')
  const iv = b.slice(0, 12)
  const tag = b.slice(12, 28)
  const text = b.slice(28)
  const key = deriveKey(secret)
  const decipher = crypto.createDecipheriv(ALGO, key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(text), decipher.final()]).toString('utf8')
}
