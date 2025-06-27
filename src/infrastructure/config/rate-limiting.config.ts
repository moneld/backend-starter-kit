import { registerAs } from '@nestjs/config';
import { UserRole } from 'generated/prisma';

export default registerAs('rateLimiting', () => ({
  endpoints: {
    login: {
      ttl: 60000, // 1 minute
      limit: 3,
    },
    register: {
      ttl: 3600000, // 1 hour
      limit: 5,
    },
    passwordReset: {
      ttl: 3600000, // 1 hour
      limit: 3,
    },
    api: {
      ttl: 60000, // 1 minute
      limit: 100,
    },
  },
  skipForRoles: [UserRole.ADMIN], // Skip rate limiting for admins
}));
