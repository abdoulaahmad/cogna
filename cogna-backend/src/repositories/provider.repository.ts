import prisma from '@/config/database'
import type { Prisma, Provider } from '@prisma/client'
import { encryptCredential } from '@/utils/credential-crypto'

type ProviderInput = {
  name: string
  baseUrl: string
  apiKey: string
  apiSecret?: string
  apiConfig?: Record<string, unknown>
  status?: 'ACTIVE' | 'INACTIVE'
}

type ProviderUpdate = Partial<ProviderInput>

export const ProviderRepository = {
  async findAll(): Promise<Provider[]> {
    return prisma.provider.findMany({ orderBy: { name: 'asc' } })
  },

  async findById(id: string): Promise<Provider | null> {
    return prisma.provider.findUnique({ where: { id } })
  },

  async create(data: ProviderInput): Promise<Provider> {
    const { apiConfig, apiKey, apiSecret, ...rest } = data

    return prisma.provider.create({
      data: {
        ...rest,
        apiKey: encryptCredential(apiKey),
        ...(apiSecret !== undefined && { apiSecret: encryptCredential(apiSecret) }),
        ...(apiConfig !== undefined && { apiConfig: apiConfig as Prisma.InputJsonValue }),
      },
    })
  },

  async update(id: string, data: ProviderUpdate): Promise<Provider> {
    const { apiConfig, apiKey, apiSecret, ...rest } = data

    return prisma.provider.update({
      where: { id },
      data: {
        ...rest,
        ...(apiKey !== undefined && { apiKey: encryptCredential(apiKey) }),
        ...(apiSecret !== undefined && { apiSecret: encryptCredential(apiSecret) }),
        ...(apiConfig !== undefined && { apiConfig: apiConfig as Prisma.InputJsonValue }),
      },
    })
  },

  async delete(id: string): Promise<Provider> {
    return prisma.provider.delete({ where: { id } })
  },
}