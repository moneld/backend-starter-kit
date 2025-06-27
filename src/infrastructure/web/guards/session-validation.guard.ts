import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { ISessionManagerService } from '@domain/services/session-manager.service.interface';

@Injectable()
export class SessionValidationGuard implements CanActivate {
  constructor(
    @Inject('ISessionManagerService')
    private readonly sessionManagerService: ISessionManagerService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const sessionId = request.headers['x-session-id'];

    if (!sessionId) {
      return true; // Let JWT guard handle authentication
    }

    const isValid = await this.sessionManagerService.validateSession(sessionId);

    if (!isValid) {
      return false;
    }

    return true;
  }
}
