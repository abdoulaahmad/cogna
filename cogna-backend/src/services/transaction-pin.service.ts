import bcrypt from 'bcryptjs'
import { UserRepository } from '@/repositories/user.repository'
import { ConflictError, NotFoundError, UnauthorizedError } from '@/utils/errors'

const BCRYPT_ROUNDS = 12

/**
 * Verifies the caller's identity by checking either their transaction PIN or
 * their account login password.  Throws UnauthorizedError if neither matches.
 */
async function assertIdentity(
  user: { transactionPinHash: string | null; passwordHash: string },
  proof: { currentPin?: string; password?: string }
): Promise<void> {
  // Try PIN first if provided
  if (proof.currentPin) {
    if (!user.transactionPinHash) {
      throw new UnauthorizedError('No transaction PIN is set on this account')
    }
    const pinOk = await bcrypt.compare(proof.currentPin, user.transactionPinHash)
    if (pinOk) return
    throw new UnauthorizedError('Incorrect transaction PIN')
  }

  // Fall back to account password
  if (proof.password) {
    const pwOk = await bcrypt.compare(proof.password, user.passwordHash)
    if (pwOk) return
    throw new UnauthorizedError('Incorrect account password')
  }

  throw new UnauthorizedError('No credential provided to verify identity')
}

// Failed PIN attempt tracking to prevent brute-force attacks (F-18)
const failedPinAttempts = new Map<string, { count: number; lockedUntil: number }>();

function checkPinAttemptThrottling(userId: string) {
  const record = failedPinAttempts.get(userId);
  if (record && record.lockedUntil > Date.now()) {
    const remainingSeconds = Math.ceil((record.lockedUntil - Date.now()) / 1000);
    throw new UnauthorizedError(`Account PIN verification locked due to too many failed attempts. Try again in ${remainingSeconds} seconds.`);
  }
}

function recordFailedPinAttempt(userId: string) {
  const now = Date.now();
  const record = failedPinAttempts.get(userId) || { count: 0, lockedUntil: 0 };
  record.count += 1;
  if (record.count >= 5) {
    record.lockedUntil = now + 30 * 60 * 1000; // 30-minute lockout after 5 consecutive failures
    record.count = 0;
  }
  failedPinAttempts.set(userId, record);
}

function clearFailedPinAttempts(userId: string) {
  failedPinAttempts.delete(userId);
}

export const TransactionPinService = {
  /**
   * Verifies the PIN at checkout.  Used by WalletService.purchase().
   */
  async verifyPin(userId: string, pin: string): Promise<void> {
    checkPinAttemptThrottling(userId)

    const user = await UserRepository.findById(userId)
    if (!user) throw new NotFoundError('User')
    if (!user.transactionPinHash) {
      throw new UnauthorizedError('Transaction PIN is not set. Please configure your PIN in Security settings.')
    }
    const ok = await bcrypt.compare(pin, user.transactionPinHash)
    if (!ok) {
      recordFailedPinAttempt(userId)
      throw new UnauthorizedError('Incorrect transaction PIN')
    }
    clearFailedPinAttempts(userId)
  },

  /**
   * Sets or replaces the transaction PIN.
   * - First-time set (no existing hash): caller must provide their account password.
   * - Changing an existing PIN: caller may provide either the current PIN or their account password.
   */
  async setPin(
    userId: string,
    input: { newPin: string; currentPin?: string; password?: string }
  ): Promise<void> {
    const user = await UserRepository.findById(userId)
    if (!user) throw new NotFoundError('User')

    if (user.transactionPinHash) {
      // Existing PIN — require proof of identity
      await assertIdentity(user, { currentPin: input.currentPin, password: input.password })
    } else {
      // No existing PIN — require account password for bootstrap security
      if (!input.password) {
        throw new UnauthorizedError('Please provide your account password to set your transaction PIN for the first time')
      }
      const pwOk = await bcrypt.compare(input.password, user.passwordHash)
      if (!pwOk) throw new UnauthorizedError('Incorrect account password')
    }

    const pinHash = await bcrypt.hash(input.newPin, BCRYPT_ROUNDS)
    await UserRepository.updateTransactionPin(userId, pinHash)
  },

  /**
   * Enables or disables the transaction PIN requirement.
   * - Enabling: no proof required (always safe).
   * - Disabling: caller must provide current PIN to prevent session takeover bypass.
   */
  async setPinStatus(
    userId: string,
    input: { enabled: boolean; currentPin?: string; password?: string }
  ): Promise<void> {
    const user = await UserRepository.findById(userId)
    if (!user) throw new NotFoundError('User')

    if (input.enabled) {
      // Cannot enable PIN protection if no PIN has been set yet
      if (!user.transactionPinHash) {
        throw new ConflictError('You must set a transaction PIN before enabling PIN protection')
      }
    } else {
      // Disabling requires current PIN (F-15)
      if (!input.currentPin) {
        throw new UnauthorizedError('Current transaction PIN is required to disable PIN protection')
      }
      if (!user.transactionPinHash) {
        throw new UnauthorizedError('No transaction PIN is set on this account')
      }
      const pinOk = await bcrypt.compare(input.currentPin, user.transactionPinHash)
      if (!pinOk) {
        recordFailedPinAttempt(userId)
        throw new UnauthorizedError('Incorrect transaction PIN')
      }
      clearFailedPinAttempts(userId)
    }
    await UserRepository.updateTransactionPinStatus(userId, input.enabled)
  },

  /**
   * Returns PIN status — never exposes the hash.
   */
  async getPinStatus(userId: string): Promise<{ transactionPinEnabled: boolean; hasPinSet: boolean }> {
    const user = await UserRepository.findById(userId)
    if (!user) throw new NotFoundError('User')
    return {
      transactionPinEnabled: user.transactionPinEnabled,
      hasPinSet: user.transactionPinHash !== null,
    }
  },
}
