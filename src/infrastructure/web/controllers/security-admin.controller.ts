import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { UserRole } from 'generated/prisma';
import { UnlockUserUseCase } from '@application/use-cases/auth/unlock-user.use-case';
import { GetSecurityStatsUseCase } from '@application/use-cases/auth/get-security-stats.use-case';
import { ForceLogoutUseCase } from '@application/use-cases/auth/force-logout.use-case';
import { IAccountLockService } from '@domain/services/account-lock.service.interface';
import { SkipThrottle } from '@nestjs/throttler';

@Controller('auth/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@SkipThrottle()
export class SecurityAdminController {
  constructor(
    private readonly unlockUserUseCase: UnlockUserUseCase,
    private readonly getSecurityStatsUseCase: GetSecurityStatsUseCase,
    private readonly forceLogoutUseCase: ForceLogoutUseCase,
    @Inject('IAccountLockService')
    private readonly accountLockService: IAccountLockService,
  ) {}

  @Post('unlock-user/:id')
  @HttpCode(HttpStatus.OK)
  async unlockUser(
    @CurrentUser() admin: CurrentUser,
    @Param('id') userId: string,
  ) {
    await this.unlockUserUseCase.execute(admin.userId, userId);

    return {
      message: 'User account unlocked successfully',
    };
  }

  @Get('security-stats')
  async getSecurityStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return await this.getSecurityStatsUseCase.execute(start, end);
  }

  @Get('locked-accounts')
  async getLockedAccounts() {
    const lockedAccounts = await this.accountLockService.getLockedAccounts();

    return {
      total: lockedAccounts.length,
      accounts: lockedAccounts,
    };
  }

  @Post('force-logout/:id')
  @HttpCode(HttpStatus.OK)
  async forceLogout(
    @CurrentUser() admin: CurrentUser,
    @Param('id') userId: string,
  ) {
    await this.forceLogoutUseCase.execute(admin.userId, userId);

    return {
      message: 'User has been forcefully logged out from all devices',
    };
  }
}
