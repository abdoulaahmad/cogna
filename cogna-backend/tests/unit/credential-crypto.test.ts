import { describe, expect, it } from 'vitest'
import { decryptCredential, encryptCredential } from '@/utils/credential-crypto'

describe('provider credential crypto', () => {
  it('encrypts and decrypts a credential', () => {
    const encrypted = encryptCredential('provider-secret-value')

    expect(encrypted).toMatch(/^v1:/)
    expect(encrypted).not.toContain('provider-secret-value')
    expect(decryptCredential(encrypted)).toBe('provider-secret-value')
  })

  it('uses a unique initialization vector for each encryption', () => {
    expect(encryptCredential('same-secret')).not.toBe(encryptCredential('same-secret'))
  })

  it('permits legacy plaintext credentials during rotation', () => {
    expect(decryptCredential('legacy-provider-key')).toBe('legacy-provider-key')
  })

  it('rejects malformed encrypted credentials', () => {
    expect(() => decryptCredential('v1:not-valid')).toThrow('invalid encrypted format')
  })
})