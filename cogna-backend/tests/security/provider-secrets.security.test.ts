import { describe, it, expect } from 'vitest'
import { encryptCredential, decryptCredential } from '@/utils/credential-crypto'

describe('Security Suite: Provider Secrets & Cryptographic Hygiene', () => {
  describe('AES-256-GCM Credential Encryption Defenses', () => {
    const rawApiKey = 'sk_live_akunding_secret_998877665544332211'

    it('encrypts credentials into formatted version:IV:authTag:ciphertext structure', () => {
      const encrypted = encryptCredential(rawApiKey)
      const parts = encrypted.split(':')

      expect(parts.length).toBe(4)
      const [version, ivB64, tagB64, cipherB64] = parts

      expect(version).toBe('v1')
      expect(Buffer.from(ivB64, 'base64').length).toBe(12) // 12-byte IV
      expect(Buffer.from(tagB64, 'base64').length).toBe(16) // 16-byte Auth Tag
      expect(cipherB64.length).toBeGreaterThan(0)
    })

    it('successfully decrypts an authentic encrypted credential', () => {
      const encrypted = encryptCredential(rawApiKey)
      const decrypted = decryptCredential(encrypted)

      expect(decrypted).toBe(rawApiKey)
    })

    it('rejects tampered ciphertext with cryptographic authentication failure', () => {
      const encrypted = encryptCredential(rawApiKey)
      const [version, iv, tag, cipher] = encrypted.split(':')

      // Tamper with the last byte of the ciphertext
      const tamperedCipher = cipher.slice(0, -2) + (cipher.slice(-2) === 'aa' ? 'bb' : 'aa')
      const tamperedPayload = `${version}:${iv}:${tag}:${tamperedCipher}`

      expect(() => decryptCredential(tamperedPayload)).toThrow()
    })

    it('rejects modified authentication tag with authentication failure', () => {
      const encrypted = encryptCredential(rawApiKey)
      const [version, iv, tag, cipher] = encrypted.split(':')

      // Tamper with the authentication tag
      const tamperedTag = tag.slice(0, -2) + (tag.slice(-2) === '00' ? '11' : '00')
      const tamperedPayload = `${version}:${iv}:${tamperedTag}:${cipher}`

      expect(() => decryptCredential(tamperedPayload)).toThrow()
    })
  })
})
