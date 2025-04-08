import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV,
  name: process.env.APP_NAME,
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  apiPrefix: process.env.API_PREFIX,
  apiVersion: process.env.API_VERSION,
  url: process.env.APP_URL,

  // CORS et sécurité
  corsOrigin: process.env.CORS_ORIGIN,
  enableCsrfProtection: process.env.ENABLE_CSRF_PROTECTION === 'true',
  enableSwagger: process.env.ENABLE_SWAGGER !== 'false',
  enableStrictSecurity: process.env.ENABLE_STRICT_SECURITY === 'true',

  // Logging
  logLevel: process.env.LOG_LEVEL,
  logToFile: process.env.LOG_TO_FILE === 'true',
  logFilePath: process.env.LOG_FILE_PATH,

  // Rate limiting général
  rateLimitTtl: parseInt(process.env.RATE_LIMIT_TTL || '60', 10),
  rateLimitLimit: parseInt(process.env.RATE_LIMIT_LIMIT || '100', 10),

  // Rate limiting spécifique à l'authentification
  authRateLimitTtl: parseInt(process.env.AUTH_RATE_LIMIT_TTL || '900', 10), // 15 minutes
  authRateLimitLimit: parseInt(process.env.AUTH_RATE_LIMIT_LIMIT || '5', 10),

  // Rate limiting pour les API
  apiRateLimitTtl: parseInt(process.env.API_RATE_LIMIT_TTL || '60', 10),
  apiRateLimitLimit: parseInt(process.env.API_RATE_LIMIT_LIMIT || '30', 10),

  // I18n
  defaultLanguage: process.env.DEFAULT_LANGUAGE || 'fr',
  supportedLanguages: (process.env.SUPPORTED_LANGUAGES || 'fr,en').split(','),

  // Sécurité des mots de passe
  passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8', 10),
  passwordMaxLength: parseInt(process.env.PASSWORD_MAX_LENGTH || '100', 10),

  // Expiration des tokens
  verificationTokenExpiryHours: parseInt(process.env.VERIFICATION_TOKEN_EXPIRY_HOURS || '24', 10),
  resetTokenExpiryMinutes: parseInt(process.env.RESET_TOKEN_EXPIRY_MINUTES || '60', 10),

  // Verrouillage de compte
  maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10),
  accountLockDurationMinutes: parseInt(process.env.ACCOUNT_LOCK_DURATION_MINUTES || '15', 10),

  // Autres configurations
  defaultPageSize: parseInt(process.env.DEFAULT_PAGE_SIZE || '10', 10),
  maxPageSize: parseInt(process.env.MAX_PAGE_SIZE || '100', 10),
}));