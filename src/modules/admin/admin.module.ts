import { Module } from '@nestjs/common';
import { AdminController } from '@infrastructure/web/controllers/admin.controller';

@Module({
  controllers: [AdminController],
})
export class AdminModule {}
