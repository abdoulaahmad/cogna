import prisma from '@/config/database';
import { createHash } from 'crypto';
import { ValidationError, NotFoundError } from '@/utils/errors';

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
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

    // Generate a 6-digit numeric OTP for better UX when copying
    const rawToken = Math.floor(100000 + Math.random() * 900000).toString();
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
   */
  async consumeToken(rawToken: string, type: 'PASSWORD_RESET' | 'EMAIL_VERIFICATION'): Promise<string> {
    const tokenHash = hashToken(rawToken);

    const record = await prisma.verificationToken.findUnique({
      where: { tokenHash }
    });

    if (!record || record.type !== type) {
      throw new NotFoundError('Invalid or unrecognized token');
    }

    if (record.consumedAt) {
      throw new ValidationError('This token has already been consumed');
    }

    if (record.expiresAt < new Date()) {
      throw new ValidationError('This token has expired');
    }

    // Mark as consumed
    await prisma.verificationToken.update({
      where: { id: record.id },
      data: { consumedAt: new Date() }
    });

    return record.userId;
  }
};
