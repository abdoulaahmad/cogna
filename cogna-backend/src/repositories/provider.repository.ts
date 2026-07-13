import prisma from '@/config/database'
import type { Provider, Prisma } from '@prisma/client'

export const ProviderRepository = {

  /** Get all providers (admin only) */
  async findAll(): Promise<Provider[]> {
    return prisma.provider.findMany({ orderBy: { name: 'asc' } })
  },

  /** Find a provider by UUID */
  async findById(id: string): Promise<Provider | null> {
    return prisma.provider.findUnique({ where: { id } })
  },

  /** Create a new provider (admin only) */
  async create(data: {
    name:       string
    baseUrl:    string
    apiKey:     string
    apiSecret?: string
    apiConfig?: Record<string, unknown>
    status?:    'ACTIVE' | 'INACTIVE'
  }): Promise<Provider> {
    const { apiConfig, ...rest } = data
    return prisma.provider.create({
      data: {
        ...rest,
        ...(apiConfig !== undefined && { apiConfig: apiConfig as Prisma.InputJsonValue }),
      },
    })
  },

  /** Update a provider (admin only) */
  async update(
    id:   string,
    data: Partial<{
      name:      string
      baseUrl:   string
      apiKey:    string
      apiSecret: string
      apiConfig: Record<string, unknown>
      status:    'ACTIVE' | 'INACTIVE'
    }>
  ): Promise<Provider> {
    const { apiConfig, ...rest } = data
    return prisma.provider.update({
      where: { id },
      data:  {
        ...rest,
        ...(apiConfig !== undefined && { apiConfig: apiConfig as Prisma.InputJsonValue }),
      },
    })
  },

  /** Delete a provider (admin only) */
  async delete(id: string): Promise<Provider> {
    return prisma.provider.delete({ where: { id } })
  },
}
