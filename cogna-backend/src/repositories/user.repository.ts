import prisma from '@/config/database'
import type { User, UserRole } from '@prisma/client'

export const UserRepository = {
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } })
  },

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } })
  },

  async create(data: {
    fullName:            string
    email:               string
    passwordHash:        string
    role?:               UserRole
    transactionPinHash?: string
  }): Promise<User> {
    return prisma.user.create({ data })
  },

  async updateStatus(id: string, status: User['status']): Promise<User> {
    return prisma.user.update({ where: { id }, data: { status } })
  },

  async markEmailVerified(id: string): Promise<User> {
    return prisma.user.update({ where: { id }, data: { emailVerified: true, status: 'ACTIVE' } })
  },

  async updatePassword(id: string, passwordHash: string): Promise<User> {
    return prisma.user.update({ where: { id }, data: { passwordHash } })
  },

  async resetPasswordAndVerifyEmail(id: string, passwordHash: string): Promise<User> {
    return prisma.user.update({ where: { id }, data: { passwordHash, emailVerified: true, status: 'ACTIVE' } })
  },

  async updateTransactionPin(id: string, pinHash: string | null): Promise<User> {
    return prisma.user.update({ where: { id }, data: { transactionPinHash: pinHash } })
  },

  async updateTransactionPinStatus(id: string, enabled: boolean): Promise<User> {
    return prisma.user.update({ where: { id }, data: { transactionPinEnabled: enabled } })
  },
}
