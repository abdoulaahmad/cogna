import prisma from '@/config/database'
import type { UserCapability } from '@prisma/client'

export const UserCapabilityRepository = {
  async enableDeveloper(userId: string): Promise<UserCapability> {
    return prisma.userCapability.upsert({ where: { userId_type: { userId, type: 'DEVELOPER' } }, create: { userId, type: 'DEVELOPER' }, update: {} })
  },
  async hasDeveloper(userId: string): Promise<boolean> {
    return (await prisma.userCapability.findUnique({ where: { userId_type: { userId, type: 'DEVELOPER' } } })) !== null
  },
}