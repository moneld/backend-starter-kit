import fastifyCsrf from '@fastify/csrf-protection';
import helmet from '@fastify/helmet';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { contentParser } from 'fastify-multer';
import { AppModule } from './app.module';
import { setupLogger } from './common/logger/logger.config';
import { setupSwagger } from './common/swagger/swagger.config';

async function bootstrap() {
  // Création de l'application avec Fastify
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: true,
      trustProxy: true, // Nécessaire si derrière un proxy/load balancer
    }),
  );

  // Récupération du service de configuration
  const configService = app.get(ConfigService);

  // Configuration du logger avancé
  setupLogger(app, configService);

  // Configuration du préfixe global de l'API
  const apiPrefix = configService.get('app.apiPrefix', 'api');
  app.setGlobalPrefix(apiPrefix);

  // Configuration du versioning de l'API
  app.enableVersioning({
    type: VersioningType.URI, // Type de versioning: URI, Header, ou MediaType
    defaultVersion: configService.get('app.apiVersion', '1'),
    prefix: 'v', // Préfixe pour les versions: v1, v2, etc.
  });

  // Enregistrer le middleware content-parser pour gérer multipart/form-data
  await app.register(contentParser);

  // Configuration de Helmet pour la sécurité des headers HTTP
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: [`'self'`],
        styleSrc: [`'self'`, `'unsafe-inline'`],
        scriptSrc: [`'self'`, `'unsafe-inline'`, `'unsafe-eval'`],
        imgSrc: [`'self'`, 'data:', 'validator.swagger.io'],
        connectSrc: [`'self'`],
      },
    },
    // Si vous avez besoin de Swagger UI en production
    ...(configService.get('app.nodeEnv') === 'production'
      ? {}
      : { contentSecurityPolicy: false }),
  });

  // Protection CSRF (Cross-Site Request Forgery)
  if (configService.get('app.enableCsrfProtection', false)) {
    await app.register(fastifyCsrf);
  }

  // Configuration des CORS
  app.enableCors({
    origin: configService.get<string>('app.corsOrigin', '*'),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: false, // Activer si vous utilisez des cookies d'authentification
    allowedHeaders: 'Content-Type,Accept,Authorization,X-Custom-Lang',
    exposedHeaders: 'X-Total-Count,X-Total-Pages',
    maxAge: 86400, // 24 heures de mise en cache des pre-flight requests
  });

  // Configuration du ValidationPipe global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Supprime les propriétés non définies dans les DTOs
      forbidNonWhitelisted: true, // Rejette les requêtes avec des propriétés non définies
      transform: true, // Transforme les données selon les types des DTOs
      transformOptions: {
        enableImplicitConversion: false, // Conversion implicite désactivée pour plus de sécurité
      },
      validationError: {
        target: false, // Ne pas exposer l'objet cible dans les erreurs
        value: false, // Ne pas exposer les valeurs dans les erreurs
      },
    }),
  );

  // Configuration de Swagger
  setupSwagger(app, configService);

  // Démarrage du serveur
  const port = configService.get<number>('PORT', 3000);
  const host = configService.get<string>('HOST', '0.0.0.0');
  await app.listen(port, host);
  console.log(`Application running on: ${await app.getUrl()}`);
}
bootstrap();
