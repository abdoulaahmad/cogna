import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import prisma from '@/config/database';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { VerificationTokenService } from '@/services/verification-token.service';
import { AuditLogService } from '@/services/audit-log.service';
import { NotFoundError, UnauthorizedError } from '@/utils/errors';
import { successResponse } from '@/utils/response';
import { handleRouteError } from '@/utils/handle-error';
import { EmailService } from '@/services/email.service';

const BCRYPT_ROUNDS = 12;

// Validators
const updateProfileSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
});

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

const resetPasswordRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

const updatePreferencesSchema = z.object({
  emailFunding: z.boolean().optional(),
  emailPurchase: z.boolean().optional(),
  emailFulfillment: z.boolean().optional(),
  emailRefund: z.boolean().optional(),
  emailSecurity: z.boolean().optional(),
});

export default async function profileRoutes(app: FastifyInstance) {

  // ─── Update Profile ────────────────────────────────────────────────────────
  app.put('/profile', { onRequest: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { sub } = req.user as { sub: string };
      const { fullName } = updateProfileSchema.parse(req.body);

      const existing = await prisma.user.findUnique({ where: { id: sub } });
      if (!existing) throw new NotFoundError('User');

      const updated = await prisma.user.update({
        where: { id: sub },
        data: { fullName }
      });

      await AuditLogService.recordAuditEvent(sub, 'PROFILE_UPDATE', 'users', sub, req.ip, {
        reason: 'User modified profile details',
        beforeSnapshot: { fullName: existing.fullName },
        afterSnapshot: { fullName: updated.fullName }
      });

      return reply.send(successResponse(updated, 'Profile updated successfully'));
    } catch (error) { return handleRouteError(error, reply); }
  });

  // ─── Change Password ───────────────────────────────────────────────────────
  app.post('/profile/change-password', { onRequest: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { sub } = req.user as { sub: string };
      const { oldPassword, newPassword } = changePasswordSchema.parse(req.body);

      const user = await prisma.user.findUnique({ where: { id: sub } });
      if (!user) throw new NotFoundError('User');

      const valid = await bcrypt.compare(oldPassword, user.passwordHash);
      if (!valid) throw new UnauthorizedError('Current password is incorrect');

      const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

      await prisma.user.update({
        where: { id: sub },
        data: { passwordHash }
      });

      await AuditLogService.recordAuditEvent(sub, 'PASSWORD_CHANGE', 'users', sub, req.ip, {
        reason: 'User changed account password'
      });

      return reply.send(successResponse(null, 'Password updated successfully'));
    } catch (error) { return handleRouteError(error, reply); }
  });

  // ─── Reset Password Request ────────────────────────────────────────────────
  app.post('/profile/reset-password-request', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { email } = resetPasswordRequestSchema.parse(req.body);

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        // Obfuscate user presence for safety
        return reply.send(successResponse({ email }, 'If the email exists, a password reset link will be sent'));
      }

      const rawToken = await VerificationTokenService.createToken(user.id, 'PASSWORD_RESET');
      
      // Send the email (mocked if SMTP is not configured)
      await EmailService.sendPasswordResetEmail(email, rawToken);

      return reply.send(successResponse({ email }, 'If the email exists, a password reset link will be sent'));
    } catch (error) { return handleRouteError(error, reply); }
  });

  // ─── Reset Password ────────────────────────────────────────────────────────
  app.post('/profile/reset-password', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { token, newPassword } = resetPasswordSchema.parse(req.body);

      const userId = await VerificationTokenService.consumeToken(token, 'PASSWORD_RESET');
      const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash }
      });

      await AuditLogService.recordAuditEvent(userId, 'PASSWORD_RESET_COMPLETED', 'users', userId, null, {
        reason: 'User completed password reset flow'
      });

      return reply.send(successResponse(null, 'Password reset successful'));
    } catch (error) { return handleRouteError(error, reply); }
  });

  // ─── Verify Email Request ──────────────────────────────────────────────────
  app.post('/profile/verify-email-request', { onRequest: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { sub } = req.user as { sub: string };

      const rawToken = await VerificationTokenService.createToken(sub, 'EMAIL_VERIFICATION');

      return reply.send(successResponse({ token: rawToken }, 'Verification token generated'));
    } catch (error) { return handleRouteError(error, reply); }
  });

  // ─── Verify Email ──────────────────────────────────────────────────────────
  app.post('/profile/verify-email', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { token } = verifyEmailSchema.parse(req.body);

      const userId = await VerificationTokenService.consumeToken(token, 'EMAIL_VERIFICATION');

      await prisma.user.update({
        where: { id: userId },
        data: { emailVerified: true }
      });

      await AuditLogService.recordAuditEvent(userId, 'EMAIL_VERIFIED', 'users', userId, null, {
        reason: 'User verified account email'
      });

      return reply.send(successResponse(null, 'Email verification successful'));
    } catch (error) { return handleRouteError(error, reply); }
  });

  // ─── Get Preferences ──────────────────────────────────────────────────────
  app.get('/profile/notification-preferences', { onRequest: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { sub } = req.user as { sub: string };

      let prefs = await prisma.notificationPreference.findUnique({
        where: { userId: sub }
      });

      if (!prefs) {
        prefs = await prisma.notificationPreference.create({
          data: { userId: sub }
        });
      }

      return reply.send(successResponse(prefs));
    } catch (error) { return handleRouteError(error, reply); }
  });

  // ─── Update Preferences ───────────────────────────────────────────────────
  app.put('/profile/notification-preferences', { onRequest: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { sub } = req.user as { sub: string };
      const body = updatePreferencesSchema.parse(req.body);

      const existing = await prisma.notificationPreference.findUnique({
        where: { userId: sub }
      });

      const updated = await prisma.notificationPreference.upsert({
        where: { userId: sub },
        create: {
          userId: sub,
          ...body
        },
        update: body
      });

      await AuditLogService.recordAuditEvent(sub, 'PREFERENCES_UPDATE', 'notification_preferences', updated.id, req.ip, {
        reason: 'User updated notification preferences',
        beforeSnapshot: existing as unknown as Record<string, unknown>,
        afterSnapshot: updated
      });

      return reply.send(successResponse(updated, 'Preferences updated successfully'));
    } catch (error) { return handleRouteError(error, reply); }
  });
}
