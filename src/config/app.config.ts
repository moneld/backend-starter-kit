import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV,
  name: process.env.APP_NAME,
  port: parseInt(process.env.PORT || '3000', 10),
  apiPrefix: process.env.API_PREFIX,
  apiVersion: process.env.API_VERSION,
  url: process.env.APP_URL,
  corsOrigin: process.env.CORS_ORIGIN,
  logLevel: process.env.LOG_LEVEL,
  logToFile: process.env.LOG_TO_FILE === 'true',
  logFilePath: process.env.LOG_FILE_PATH,
  rateLimitTtl: parseInt(process.env.RATE_LIMIT_TTL || '60', 10),
  rateLimitLimit: parseInt(process.env.RATE_LIMIT_LIMIT || '100', 10),
  defaultLanguage: process.env.DEFAULT_LANGUAGE || 'fr',
  supportedLanguages: (process.env.SUPPORTED_LANGUAGES || 'fr,en').split(','),
}));
