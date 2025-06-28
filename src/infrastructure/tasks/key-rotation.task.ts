import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { IKeyRotationService } from '@domain/services/key-rotation.service.interface';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class KeyRotationTask {
  private readonly logger = new Logger(KeyRotationTask.name);

  constructor(
    @Inject('IKeyRotationService')
    private readonly keyRotationService: IKeyRotationService,
    private readonly configService: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleKeyRotation() {
    const rotationEnabled = this.configService.get<boolean>(
      'crypto.keyRotation.enabled',
    );

    if (!rotationEnabled) {
      return;
    }

    try {
      const shouldRotate = await this.keyRotationService.shouldRotate();

      if (shouldRotate) {
        this.logger.log('Starting scheduled key rotation');

        const result = await this.keyRotationService.rotateKeys();

        this.logger.log(
          `Key rotation completed: version ${result.newKeyVersion}, ` +
          `${result.rotatedDataCount} records processed in ${result.duration}ms`,
        );
      }
    } catch (error) {
      this.logger.error('Key rotation task failed', error);
    }
  }
}