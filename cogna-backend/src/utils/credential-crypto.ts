import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto'
import { env } from '@/config/env'

const CREDENTIAL_VERSION = 'v1'

function encryptionKey(): Buffer {
  const secret = env.PROVIDER_ENCRYPTION_KEY

  if (!secret) {
    throw new Error('PROVIDER_ENCRYPTION_KEY is required to encrypt provider credentials')
  }

  return createHash('sha256').update(secret).digest()
}

export function encryptCredential(value: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv)
  const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()

  return [CREDENTIAL_VERSION, iv.toString('base64'), authTag.toString('base64'), ciphertext.toString('base64')].join(':')
}

/**
 * Plaintext values are accepted temporarily so existing provider rows can be
 * rotated without an outage. Every create or credential update re-encrypts them.
 */
export function decryptCredential(value: string): string {
  if (!value.startsWith(`${CREDENTIAL_VERSION}:`)) return value

  const parts = value.split(':')
  if (parts.length !== 4 || parts.some((part) => !part)) {
    throw new Error('Provider credential has an invalid encrypted format')
  }

  const [, iv, authTag, ciphertext] = parts
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(iv, 'base64'))
  decipher.setAuthTag(Buffer.from(authTag, 'base64'))

  return Buffer.concat([decipher.update(Buffer.from(ciphertext, 'base64')), decipher.final()]).toString('utf8')
}