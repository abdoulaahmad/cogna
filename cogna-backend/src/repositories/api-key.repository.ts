import prisma from '@/config/database'
import type { ApiKey } from '@prisma/client'

export type ApiKeyOutput = Omit<ApiKey, 'scopes'> & { scopes: string[] }

function formatKey(key: any): ApiKeyOutput {
  let scopes: string[] = []
  if (Array.isArray(key.scopes)) {
    scopes = key.scopes
  } else if (typeof key.scopes === 'string') {
    try {
      const parsed = JSON.parse(key.scopes)
      scopes = Array.isArray(parsed) ? parsed : []
    } catch {
      scopes = key.scopes ? [key.scopes] : []
    }
  }
  return { ...key, scopes }
}

export const ApiKeyRepository = {

  /** List all API keys for a user (active and revoked) */
  async findByUserId(userId: string): Promise<ApiKeyOutput[]> {
    const keys = await prisma.apiKey.findMany({
      where:   { userId },
      orderBy: { createdAt: 'desc' },
    })
    return keys.map(formatKey)
  },

  /** Find a single API key by its ID, scoped to the user */
  async findById(id: string, userId: string): Promise<ApiKeyOutput | null> {
    const key = await prisma.apiKey.findFirst({ where: { id, userId } })
    return key ? formatKey(key) : null
  },

  /** Look up by the raw key value (used during request authentication) */
  async findByKey(apiKey: string): Promise<ApiKeyOutput | null> {
    const key = await prisma.apiKey.findUnique({ where: { apiKey } })
    return key ? formatKey(key) : null
  },

  /** Persist a new API key for the user */
  async create(data: {
    userId: string
    name: string
    apiKey: string
    environment?: 'TEST' | 'LIVE'
    scopes?: string[]
    expiresAt?: Date | null
  }): Promise<ApiKeyOutput> {
    const { scopes, ...rest } = data
    const key = await prisma.apiKey.create({
      data: {
        ...rest,
        scopes: scopes ? JSON.stringify(scopes) : '[]',
      },
    })
    return formatKey(key)
  },

  /** Revoke a key by setting its status to REVOKED */
  async revoke(id: string): Promise<ApiKeyOutput> {
    const key = await prisma.apiKey.update({
      where: { id },
      data:  { status: 'REVOKED' },
    })
    return formatKey(key)
  },

  /** Touch lastUsedAt when a key is used for authentication */
  async touchLastUsed(id: string): Promise<void> {
    await prisma.apiKey.update({
      where: { id },
      data:  { lastUsedAt: new Date() },
    })
  },
}
