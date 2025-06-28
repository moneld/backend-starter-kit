import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { UserRole } from 'generated/prisma';
import { RotateEncryptionKeysUseCase } from '@application/use-cases/crypto/rotate-encryption-keys.use-case';
import { GetEncryptionStatusUseCase } from '@application/use-cases/crypto/get-encryption-status.use-case';
import { SkipThrottle } from '@nestjs/throttler';

@Controller('crypto/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@SkipThrottle()
export class CryptoAdminController {
  constructor(
    private readonly rotateEncryptionKeysUseCase: RotateEncryptionKeysUseCase,
    private readonly getEncryptionStatusUseCase: GetEncryptionStatusUseCase,
  ) {}

  @Post('rotate-keys')
  @HttpCode(HttpStatus.OK)
  async rotateKeys(@CurrentUser() admin: CurrentUser) {
    return await this.rotateEncryptionKeysUseCase.execute(admin.userId);
  }

  @Get('status')
  async getStatus() {
    return await this.getEncryptionStatusUseCase.execute();
  }
}
