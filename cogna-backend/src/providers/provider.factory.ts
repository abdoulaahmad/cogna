import { prisma } from '@/config/database'
import { AkudingAdapter } from './akunding.adapter'
import type { IProvider } from './provider.interface'

/**
 * Loads a provider by its immutable database ID and returns the matching adapter.
 * Product records store provider IDs, so resolving by ID prevents name changes
 * from breaking queued fulfillment jobs.
 */
export async function getProvider(providerId: string): Promise<IProvider> {
  const record = await prisma.provider.findUnique({ where: { id: providerId } })

  if (!record) throw new Error(`Provider not found: ${providerId}`)
  if (record.status === 'INACTIVE') throw new Error(`Provider is inactive: ${record.name}`)

  switch (record.name.toLowerCase()) {
    case 'akunding':
      return new AkudingAdapter({ apiKey: record.apiKey, baseUrl: record.baseUrl })
    default:
      throw new Error(`Unsupported provider: ${record.name}`)
  }
}