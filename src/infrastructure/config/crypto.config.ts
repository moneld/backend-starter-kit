import { registerAs } from '@nestjs/config';

export default registerAs('crypto', () => ({
  masterKey: process.env.MASTER_ENCRYPTION_KEY,
  keyRotation: {
    enabled: process.env.KEY_ROTATION_ENABLED === 'true',
    intervalDays: parseInt(process.env.KEY_ROTATION_INTERVAL_DAYS || '90', 10),
    batchSize: parseInt(process.env.KEY_ROTATION_BATCH_SIZE || '100', 10),
  },
  cache: {
    ttl: parseInt(process.env.CRYPTO_CACHE_TTL || '3600', 10), // 1 heure
  },
}));