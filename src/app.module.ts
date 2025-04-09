import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { UnifiedExceptionFilter } from './common/filters/unified-exception.filter';
import { SecurityInterceptor } from './common/interceptors/security.interceptor';
import { UnifiedResponseInterceptor } from './common/interceptors/unified-response.interceptor';
import { ConfigModule } from './config';
import { AdminModule } from './modules/admin/admin.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { DocumentationModule } from './modules/documentation/documentation.module';
import { HealthModule } from './modules/health/health.module';
import { I18nModule } from './modules/i18n/i18n.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { RolesModule } from './modules/roles/roles.module';
import { UsersModule } from './modules/users/users.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    // Config Module
    ConfigModule,

    // Prisma Module
    PrismaModule,

    I18nModule,

    // Rate Limiting - Configuration améliorée
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          throttlers: [
            {
              // Limite générale standard
              ttl: configService.get<number>('app.rateLimitTtl', 60),
              limit: configService.get<number>('app.rateLimitLimit', 100),
            },
            {
              // Limite plus stricte pour les routes d'authentification
              name: 'auth',
              ttl: configService.get<number>('app.authRateLimitTtl', 60 * 15), // 15 minutes
              limit: configService.get<number>('app.authRateLimitLimit', 5),
            },
            {
              // Limite pour les requêtes de l'API
              name: 'api',
              ttl: configService.get<number>('app.apiRateLimitTtl', 60),
              limit: configService.get<number>('app.apiRateLimitLimit', 30),
            },
          ],
          skipIf: (request) => {
            // Logique pour ignorer le rate limiting dans certains cas
            // Par exemple, pour les IPs internes ou certains utilisateurs
            return configService.get('app.nodeEnv') === 'development';
          },
          // Gestion personnalisée de l'identifiant de rate limiting
          // Par défaut, utilise l'IP source, mais peut être étendu
          generateKey: (context, name) => {
            const request = context.switchToHttp().getRequest();
            // Utiliser l'ID de l'utilisateur si authentifié, sinon l'IP
            const identifier =
              request.user?.id ||
              request.ip ||
              request.headers['x-forwarded-for'] ||
              'unknown';
            return `${name}-${identifier}`;
          },
        };
      },
    }),

    // Feature Modules
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    DocumentationModule,
    HealthModule,
    AdminModule,
  ],
  controllers: [],
  providers: [
    // Filtres d'exception globaux - utiliser le filtre I18n au lieu du filtre par défaut
    {
      provide: APP_FILTER,
      useClass: UnifiedExceptionFilter,
    },
    // Filtres d'exception globaux
    /*   {
        provide: APP_FILTER,
        useClass: HttpExceptionFilter,
      }, */

    // Intercepteurs globaux
    {
      provide: APP_INTERCEPTOR,
      useClass: UnifiedResponseInterceptor,
    },
    // Intercepteur de sécurité
    {
      provide: APP_INTERCEPTOR,
      useClass: SecurityInterceptor,
    },

    // Guards globaux
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },

    // JWT Auth Guard global - toutes les routes sont protégées par défaut
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule { }
