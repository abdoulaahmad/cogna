import prisma from '@/config/database';
import crypto, { createHash } from 'crypto';
import { ValidationError, NotFoundError } from '@/utils/errors';

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

// In-memory rate-limiter for failed token attempts to prevent brute-force attacks (F-04)
const failedAttempts = new Map<string, { count: number; lockedUntil: number }>();

function checkAttemptThrottling(key: string) {
  const record = failedAttempts.get(key);
  if (record && record.lockedUntil > Date.now()) {
    const remainingSeconds = Math.ceil((record.lockedUntil - Date.now()) / 1000);
    throw new ValidationError(`Too many invalid attempts. Please try again in ${remainingSeconds} seconds.`);
  }
}

function recordFailedAttempt(key: string) {
  const now = Date.now();
  const record = failedAttempts.get(key) || { count: 0, lockedUntil: 0 };
  record.count += 1;
  if (record.count >= 5) {
    record.lockedUntil = now + 15 * 60 * 1000; // 15-minute lockout after 5 consecutive failures
    record.count = 0;
  }
  failedAttempts.set(key, record);
}

function clearFailedAttempts(key: string) {
  failedAttempts.delete(key);
}

export const VerificationTokenService = {
  /**
   * Generates a rate-limited, single-use hashed token record.
   * Returns the raw token string (only returned once!).
   */
  async createToken(userId: string, type: 'PASSWORD_RESET' | 'EMAIL_VERIFICATION'): Promise<string> {
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);

    // Check rate limit: ensure no token was created in the last 60 seconds
    const recentToken = await prisma.verificationToken.findFirst({
      where: {
        userId,
        type,
        createdAt: { gte: oneMinuteAgo }
      }
    });

    if (recentToken) {
      throw new ValidationError('Please wait 60 seconds before requesting another token');
    }

    // Generate a cryptographically secure 6-digit numeric OTP using CSPRNG (F-04)
    const rawToken = crypto.randomInt(100000, 1000000).toString();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiry

    await prisma.verificationToken.create({
      data: {
        userId,
        tokenHash,
        type,
        expiresAt
      }
    });

    return rawToken;
  },

  /**
   * Consumes a single-use token, returning the userId.
   * If userId is provided, scopes the search directly to the user (F-04).
   */
  async consumeToken(rawToken: string, type: 'PASSWORD_RESET' | 'EMAIL_VERIFICATION', userId?: string): Promise<string> {
    const throttleKey = userId || `${type}_global`;
    checkAttemptThrottling(throttleKey);

    const tokenHash = hashToken(rawToken);

    const record = userId
      ? await prisma.verificationToken.findFirst({ where: { tokenHash, userId, type } })
      : await prisma.verificationToken.findUnique({ where: { tokenHash } });

    if (!record || record.type !== type) {
      recordFailedAttempt(throttleKey);
      throw new NotFoundError('Invalid or unrecognized token');
    }

    if (record.consumedAt) {
      recordFailedAttempt(throttleKey);
      throw new ValidationError('This token has already been consumed');
    }

    if (record.expiresAt < new Date()) {
      recordFailedAttempt(throttleKey);
      throw new ValidationError('This token has expired');
    }

    clearFailedAttempts(throttleKey);

    // Mark as consumed
    await prisma.verificationToken.update({
      where: { id: record.id },
      data: { consumedAt: new Date() }
    });

    return record.userId;
  }
};
