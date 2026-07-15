import { createHash, randomBytes } from 'crypto'
import { ApiKeyRepository } from '@/repositories/api-key.repository'
import { NotFoundError } from '@/utils/errors'

function generateApiKey(environment: 'TEST' | 'LIVE' = 'TEST'): string {
  const prefix = environment === 'LIVE' ? 'cg_live_' : 'cg_test_'
  return prefix + randomBytes(24).toString('hex')
}

function hashApiKey(apiKey: string): string {
  return createHash('sha256').update(apiKey).digest('hex')
}

export const DeveloperService = {
  async listApiKeys(userId: string) {
    return ApiKeyRepository.findByUserId(userId)
  },

  async createApiKey(
    userId: string,
    name: string,
    environment: 'TEST' | 'LIVE' = 'TEST',
    scopes: string[] = [],
    expiresInDays?: number
  ) {
    const rawKey = generateApiKey(environment)
    let expiresAt: Date | null = null
    if (expiresInDays) {
      expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + expiresInDays)
    }

    const key = await ApiKeyRepository.create({
      userId,
      name,
      apiKey: hashApiKey(rawKey),
      environment,
      scopes,
      expiresAt,
    })
    return { ...key, rawKey }
  },

  async revokeApiKey(keyId: string, userId: string) {
    const key = await ApiKeyRepository.findById(keyId, userId)
    if (!key) throw new NotFoundError('API key')
    return ApiKeyRepository.revoke(keyId)
  },
}