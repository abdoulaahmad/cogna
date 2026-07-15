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

      if (user.role !== 'ADMIN') {
        throw new ForbiddenError('Access restricted to administrators');
      }

      if (!user.adminRole || !allowedRoles.includes(user.adminRole)) {
        throw new ForbiddenError(`Insufficient admin privileges. Required: [${allowedRoles.join(', ')}]`);
      }
    };
  });
});
