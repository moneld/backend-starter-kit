import { ConfigModule as NestConfigModule } from '@nestjs/config';
import * as Joi from 'joi';

import { appConfig } from './app.config';
import { authConfig } from './auth.config';
import { databaseConfig } from './database.config';
import { emailConfig } from './email.config';

// Configuration globale avec validation
export const ConfigModule = NestConfigModule.forRoot({
  isGlobal: true,
  cache: true,
  load: [appConfig, authConfig, databaseConfig, emailConfig],
  expandVariables: true,
  validationSchema: Joi.object({
    // Application
    NODE_ENV: Joi.string()
      .valid('development', 'production', 'test')
      .default('development'),
    PORT: Joi.number().default(3000),
    HOST: Joi.string().default('0.0.0.0'),
    API_PREFIX: Joi.string().default('api'),
    API_VERSION: Joi.string().default('1'),
    APP_NAME: Joi.string().required(),
    APP_URL: Joi.string().required(),
    CORS_ORIGIN: Joi.string().default('*'),

    // Sécurité
    ENABLE_CSRF_PROTECTION: Joi.boolean().default(false),
    ENABLE_SWAGGER: Joi.boolean().default(true),
    ENABLE_STRICT_SECURITY: Joi.boolean().default(false),

    // Database
    DATABASE_URL: Joi.string().required(),

    // JWT
    JWT_ACCESS_SECRET: Joi.string().required(),
    JWT_ACCESS_EXPIRATION: Joi.string().default('15m'),
    JWT_REFRESH_SECRET: Joi.string().required(),
    JWT_REFRESH_EXPIRATION: Joi.string().default('7d'),

    // Email
    SMTP_HOST: Joi.string().required(),
    SMTP_PORT: Joi.number().required(),
    SMTP_USER: Joi.string().required(),
    SMTP_PASSWORD: Joi.string().required(),
    SMTP_FROM_EMAIL: Joi.string().email().required(),
    SMTP_FROM_NAME: Joi.string().required(),

    // Security
    ARGON2_MEMORY_COST: Joi.number().default(4096),
    ARGON2_HASH_LENGTH: Joi.number().default(32),
    ARGON2_TIME_COST: Joi.number().default(3),
    ARGON2_PARALLELISM: Joi.number().default(1),
    PASSWORD_MIN_LENGTH: Joi.number().default(8),
    PASSWORD_MAX_LENGTH: Joi.number().default(100),

    // Rate limiting
    RATE_LIMIT_TTL: Joi.number().default(60),
    RATE_LIMIT_LIMIT: Joi.number().default(100),
    AUTH_RATE_LIMIT_TTL: Joi.number().default(900), // 15 minutes
    AUTH_RATE_LIMIT_LIMIT: Joi.number().default(5),
    API_RATE_LIMIT_TTL: Joi.number().default(60),
    API_RATE_LIMIT_LIMIT: Joi.number().default(30),

    // 2FA
    TWO_FACTOR_AUTHENTICATION_APP_NAME: Joi.string().required(),

    // Token expiration
    VERIFICATION_TOKEN_EXPIRY_HOURS: Joi.number().default(24),
    RESET_TOKEN_EXPIRY_MINUTES: Joi.number().default(60),

    // Account security
    MAX_LOGIN_ATTEMPTS: Joi.number().default(5),
    ACCOUNT_LOCK_DURATION_MINUTES: Joi.number().default(15),

    // Logging
    LOG_LEVEL: Joi.string()
      .valid('error', 'warn', 'info', 'debug', 'verbose')
      .default('info'),
    LOG_TO_FILE: Joi.boolean().default(false),
    LOG_FILE_PATH: Joi.string().default('logs/app.log'),

    // I18n
    DEFAULT_LANGUAGE: Joi.string().default('fr'),
    SUPPORTED_LANGUAGES: Joi.string().default('fr,en'),

    // Pagination
    DEFAULT_PAGE_SIZE: Joi.number().default(10),
    MAX_PAGE_SIZE: Joi.number().default(100),
  }),
  validationOptions: {
    abortEarly: true,
  },
});
