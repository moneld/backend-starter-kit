import { registerAs } from '@nestjs/config';

export const authConfig = registerAs('auth', () => ({
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
  jwtAccessExpiration: process.env.JWT_ACCESS_EXPIRATION,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtRefreshExpiration: process.env.JWT_REFRESH_EXPIRATION,
  argon2: {
    memoryCost: parseInt(process.env.ARGON2_MEMORY_COST || '4096', 10),
    hashLength: parseInt(process.env.ARGON2_HASH_LENGTH || '32', 10),
    timeCost: parseInt(process.env.ARGON2_TIME_COST || '3', 10),
    parallelism: parseInt(process.env.ARGON2_PARALLELISM || '1', 10),
  },
  twoFactorAuthenticationAppName:
    process.env.TWO_FACTOR_AUTHENTICATION_APP_NAME,
}));
