import { Inject, Injectable, Logger } from '@nestjs/common';
import { IKeyRotationService } from '@domain/services/key-rotation.service.interface';
import { ISecurityMonitoringService } from '@domain/services/security-monitoring.service.interface';
import { SecurityEventType } from '@domain/entities/security-event.entity';

@Injectable()
export class RotateEncryptionKeysUseCase {
  private readonly logger = new Logger(RotateEncryptionKeysUseCase.name);

  constructor(
    @Inject('IKeyRotationService')
    private readonly keyRotationService: IKeyRotationService,
    @Inject('ISecurityMonitoringService')
    private readonly securityMonitoringService: ISecurityMonitoringService,
  ) {}

  async execute(adminId: string) {
    this.logger.log(`Admin ${adminId} initiated manual key rotation`);

    try {
      // Vérifier si la rotation est nécessaire
      const shouldRotate = await this.keyRotationService.shouldRotate();

      if (!shouldRotate) {
        const status = await this.keyRotationService.getRotationStatus();
        return {
          success: false,
          message: 'Key rotation not needed yet',
          status,
        };
      }

      // Effectuer la rotation
      const result = await this.keyRotationService.rotateKeys();

      // Logger l'événement de sécurité
      await this.securityMonitoringService.logSecurityEvent(
        SecurityEventType.PASSWORD_CHANGED, // Utiliser un type existant ou créer KEY_ROTATED
        adminId,
        undefined,
        undefined,
        {
          action: 'manual_key_rotation',
          newKeyVersion: result.newKeyVersion,
          rotatedDataCount: result.rotatedDataCount,
          duration: result.duration,
        },
      );

      return {
        success: true,
        message: 'Key rotation completed successfully',
        result,
      };
    } catch (error) {
      this.logger.error('Manual key rotation failed', error);
      throw error;
    }
  }
}
