import { Inject, Injectable } from '@nestjs/common';
import { ISecurityMonitoringService } from '@domain/services/security-monitoring.service.interface';

@Injectable()
export class GetSecurityStatsUseCase {
  constructor(
    @Inject('ISecurityMonitoringService')
    private readonly securityMonitoringService: ISecurityMonitoringService,
  ) {}

  async execute(startDate?: Date, endDate?: Date) {
    const start = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    const end = endDate || new Date();

    const metrics = await this.securityMonitoringService.getSecurityMetrics(
      start,
      end,
    );
    const recentEvents =
      await this.securityMonitoringService.getRecentSecurityEvents(10);

    return {
      metrics,
      recentEvents,
      period: {
        start,
        end,
      },
    };
  }
}
