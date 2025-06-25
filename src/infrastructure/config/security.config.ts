import { registerAs } from '@nestjs/config';

export default registerAs('security', () => ({
  jwt: {
    accessTokenSecret: process.env.JWT_ACCESS_SECRET || 'access-secret',
    accessTokenExpiresIn: process.env.JWT_ACCESS_EXPIRATION || '15m',
    refreshTokenSecret: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
    refreshTokenExpiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true,
  },
  throttle: {
    ttl: 60,
    limit: 10,
  },
}));
