import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from '@infrastructure/persistence/prisma/prisma.module';
import { AuthModule } from '@modules/auth/auth.module';
import { UsersModule } from '@modules/users/users.module';
import { AdminModule } from '@modules/admin/admin.module';
import { SecurityModule } from '@modules/security/security.module';
import { TasksModule } from '@modules/tasks/tasks.module';
import { CryptoModule } from '@modules/crypto/crypto.module'; // NOUVEAU
import jwtConfig from '@infrastructure/config/jwt.config';
import securityConfig from '@infrastructure/config/security.config';
import emailConfig from '@infrastructure/config/email.config';
import cryptoConfig from '@infrastructure/config/crypto.config'; // NOUVEAU

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [jwtConfig, securityConfig, emailConfig, cryptoConfig], // Ajouter cryptoConfig
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    AdminModule,
    SecurityModule,
    TasksModule,
    CryptoModule, // NOUVEAU
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}