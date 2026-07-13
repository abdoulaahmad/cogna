import prisma from '@/config/database'
import type { ApiKey } from '@prisma/client'

export const ApiKeyRepository = {

  /** List all API keys for a user (active and revoked) */
  async findByUserId(userId: string): Promise<ApiKey[]> {
    return prisma.apiKey.findMany({
      where:   { userId },
      orderBy: { createdAt: 'desc' },
    })
  },

  /** Find a single API key by its ID, scoped to the user */
  async findById(id: string, userId: string): Promise<ApiKey | null> {
    return prisma.apiKey.findFirst({ where: { id, userId } })
  },

  /** Look up by the raw key value (used during request authentication) */
  async findByKey(apiKey: string): Promise<ApiKey | null> {
    return prisma.apiKey.findUnique({ where: { apiKey } })
  },

  /** Persist a new API key for the user */
  async create(data: { userId: string; name: string; apiKey: string }): Promise<ApiKey> {
    return prisma.apiKey.create({ data })
  },

  /** Revoke a key by setting its status to INACTIVE */
  async revoke(id: string, userId: string): Promise<ApiKey> {
    return prisma.apiKey.update({
      where: { id },
      data:  { status: 'INACTIVE' },
    })
  },

  /** Touch lastUsedAt when a key is used for authentication */
  async touchLastUsed(id: string): Promise<void> {
    await prisma.apiKey.update({
      where: { id },
      data:  { lastUsedAt: new Date() },
    })
  },
}
