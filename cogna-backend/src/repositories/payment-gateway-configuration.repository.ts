import prisma from '@/config/database'
import type { PaymentGateway, PaymentGatewayConfiguration } from '@prisma/client'
import { encryptCredential } from '@/utils/credential-crypto'

type GatewayConfigurationUpdate = {
  publicKey?: string
  secretKey?: string
  enabled: boolean
}

export const PaymentGatewayConfigurationRepository = {
  findByGateway(gateway: PaymentGateway): Promise<PaymentGatewayConfiguration | null> {
    return prisma.paymentGatewayConfiguration.findUnique({ where: { gateway } })
  },

  findAll(): Promise<PaymentGatewayConfiguration[]> {
    return prisma.paymentGatewayConfiguration.findMany({ orderBy: { gateway: 'asc' } })
  },

  async upsert(gateway: PaymentGateway, input: GatewayConfigurationUpdate): Promise<PaymentGatewayConfiguration> {
    const existing = await this.findByGateway(gateway)
    if (!existing && !input.secretKey) throw new Error(`${gateway} secret key is required`)

    return prisma.paymentGatewayConfiguration.upsert({
      where: { gateway },
      create: {
        gateway,
        publicKey: input.publicKey ? encryptCredential(input.publicKey) : null,
        secretKey: encryptCredential(input.secretKey as string),
        enabled: input.enabled,
      },
      update: {
        enabled: input.enabled,
        ...(input.publicKey !== undefined && { publicKey: input.publicKey ? encryptCredential(input.publicKey) : null }),
        ...(input.secretKey !== undefined && { secretKey: encryptCredential(input.secretKey) }),
      },
    })
  },
}