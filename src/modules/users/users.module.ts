import { Module, forwardRef } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { InitializationService } from './initialization.service';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => AuthModule), // Utilisation de forwardRef pour éviter les dépendances circulaires
  ],
  providers: [UsersService, InitializationService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
