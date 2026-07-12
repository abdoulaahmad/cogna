import prisma from '@/config/database'
import type { RefreshToken } from '@prisma/client'

export const RefreshTokenRepository = {
  async create(data: { userId: string; token: string; expiresAt: Date }): Promise<RefreshToken> {
    return prisma.refreshToken.create({ data })
  },

  async findByToken(token: string): Promise<RefreshToken | null> {
    return prisma.refreshToken.findUnique({ where: { token } })
  },

  async deleteByToken(token: string): Promise<void> {
    await prisma.refreshToken.delete({ where: { token } })
  },

  async deleteAllForUser(userId: string): Promise<void> {
    await prisma.refreshToken.deleteMany({ where: { userId } })
  },

  async deleteExpired(): Promise<void> {
    await prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    })
  },
}
