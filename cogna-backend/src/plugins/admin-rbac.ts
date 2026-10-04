import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { ForbiddenError, UnauthorizedError } from '@/utils/errors';
import type { AdminRole } from '@prisma/client';

export default fp(async function adminRbacPlugin(app: FastifyInstance) {
  // Enforce admin functional role checks via returning a preHandler hook
  app.decorate('requireAdminRole', (allowedRoles: AdminRole[]) => {
    return async (req: FastifyRequest, _reply: FastifyReply) => {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const user = req.user as { role: string; adminRole?: AdminRole | null };

      if (user.role !== 'ADMIN' && (user.role as string) !== 'SUPER_ADMIN') {
        throw new ForbiddenError('Access restricted to administrators');
      }

      // SUPER_ADMIN has full permissions across all admin domains
      if (user.adminRole === 'SUPER_ADMIN' || (user.role as string) === 'SUPER_ADMIN') {
        return;
      }

      // General ADMIN role has wide administrative access
      if (user.adminRole === 'ADMIN') {
        return;
      }

      // Legacy token without sub-role: permit if allowedRoles is not strictly SUPER_ADMIN
      if (!user.adminRole) {
        if (allowedRoles.includes('ADMIN' as AdminRole) || allowedRoles.length > 1 || !allowedRoles.includes('SUPER_ADMIN' as AdminRole)) {
          return;
        }
        throw new ForbiddenError(`Insufficient admin privileges. Required: [${allowedRoles.join(', ')}]`);
      }

      if (!allowedRoles.includes(user.adminRole)) {
        throw new ForbiddenError(`Insufficient admin privileges. Required: [${allowedRoles.join(', ')}]`);
      }
    };
  });
});
