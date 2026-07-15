import { UserCapabilityRepository } from '@/repositories/user-capability.repository'
import { ForbiddenError } from '@/utils/errors'

export const DeveloperCapabilityService = {
  enable: (userId: string) => UserCapabilityRepository.enableDeveloper(userId),
  async require(userId: string) { if (!await UserCapabilityRepository.hasDeveloper(userId)) throw new ForbiddenError('Developer capability is required') },
}