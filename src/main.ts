import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from '@infrastructure/web/filters/http-exception.filter';
import { winstonConfig } from '@infrastructure/logging/winston.config';
import fastifyHelmet from '@fastify/helmet';
import fastifyCors from '@fastify/cors';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    {
      logger: winstonConfig,
    },
  );

  const configService = app.get(ConfigService);

  // Security - Helmet
  await app.register(fastifyHelmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: [`'self'`],
        styleSrc: [`'self'`, `'unsafe-inline'`],
        scriptSrc: [`'self'`, `'unsafe-inline'`, `'unsafe-eval'`],
        imgSrc: [`'self'`, 'data:', 'https:'],
        fontSrc: [`'self'`],
      },
    },
  });

  // CORS
  await app.register(fastifyCors, {
    origin: configService.get<string[]>('security.cors.origin'),
    credentials: configService.get<boolean>('security.cors.credentials'),
  });

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global filters
  app.useGlobalFilters(new AllExceptionsFilter());

  await app.listen(3000, '0.0.0.0');
  console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();
