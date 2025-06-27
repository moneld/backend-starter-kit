// src/app.module.ts (version sans guard custom global)
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from '@infrastructure/persistence/prisma/prisma.module';
import { AuthModule } from '@modules/auth/auth.module';
import { UsersModule } from '@modules/users/users.module';
import { AdminModule } from '@modules/admin/admin.module';
import { SecurityModule } from '@modules/security/security.module';
import jwtConfig from '@infrastructure/config/jwt.config';
import securityConfig from '@infrastructure/config/security.config';
import emailConfig from '@infrastructure/config/email.config';
import { TasksModule } from '@modules/tasks/tasks.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [jwtConfig, securityConfig, emailConfig],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests par minute globalement
      },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    AdminModule,
    SecurityModule,
    TasksModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // Utiliser le guard standard
    },
  ],
})
export class AppModule {}