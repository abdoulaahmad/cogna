import { prisma }         from '@/config/database'
import { AkudingAdapter } from './akunding.adapter'
import type { IProvider } from './provider.interface'

/**
 * ProviderFactory — loads provider credentials from the DB at runtime
 * and returns the correct IProvider adapter.
 *
 * No env vars needed for provider credentials — they live in the providers table.
 * Adding a new provider:
 *   1. Create <name>.adapter.ts implementing IProvider
 *   2. Register the case here
 *   3. Insert a provider row via Admin dashboard
 */
export async function getProvider(providerName: string): Promise<IProvider> {
  const record = await prisma.provider.findFirst({
    where: { name: providerName },
  })

  if (!record) throw new Error(`Provider not found: ${providerName}`)
  if (record.status === 'INACTIVE') throw new Error(`Provider is inactive: ${providerName}`)

  switch (record.name.toLowerCase()) {
    case 'akunding':
      return new AkudingAdapter({
        apiKey:  record.apiKey,
        baseUrl: record.baseUrl,
      })

    default:
      throw new Error(`Unsupported provider: ${record.name}`)
  }
}
