import { randomBytes }      from 'crypto'
import { ApiKeyRepository } from '@/repositories/api-key.repository'
import { NotFoundError }     from '@/utils/errors'

/**
 * Generate a unique Cogna API key.
 * Format: cg_live_<32-hex-chars>
 */
function generateApiKey(): string {
  return `cg_live_${randomBytes(16).toString('hex')}`
}

export const DeveloperService = {

  /**
   * List all API keys belonging to the authenticated user.
   * Keys are returned with the actual key value visible (user generated them).
   */
  async listApiKeys(userId: string) {
    return ApiKeyRepository.findByUserId(userId)
  },

  /**
   * Generate a new API key for the user with a given name label.
   */
  async createApiKey(userId: string, name: string) {
    const key = generateApiKey()
    return ApiKeyRepository.create({ userId, name, apiKey: key })
  },

  /**
   * Revoke a specific API key by ID.
   * Only the owning user can revoke their own keys.
   */
  async revokeApiKey(keyId: string, userId: string) {
    const key = await ApiKeyRepository.findById(keyId, userId)
    if (!key) throw new NotFoundError('API key')
    return ApiKeyRepository.revoke(keyId)
  },
}
