import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { LoggerModule } from './common/logger/logger.module';
import { ConfigModule } from './config';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { I18nExceptionFilter } from './modules/i18n/filters/i18n-exception.filter';
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

    // Logger Module
    LoggerModule,

    I18nModule,

    // Rate Limiting
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          throttlers: [
            {
              ttl: configService.get<number>('app.rateLimitTtl', 60),
              limit: configService.get<number>('app.rateLimitLimit', 100),
            },
          ],
        };
      },
    }),

    // Feature Modules
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule
  ],
  controllers: [],
  providers: [
    // Filtres d'exception globaux - utiliser le filtre I18n au lieu du filtre par défaut
    {
      provide: APP_FILTER,
      useClass: I18nExceptionFilter,
    },
    // Filtres d'exception globaux
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },

    // Intercepteurs globaux
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
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
