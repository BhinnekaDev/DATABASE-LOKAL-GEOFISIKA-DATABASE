import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ActivityLogModule } from '@/activity-log/activity-log.module';
import { SunshineDurationService } from '@/sunshine-duration/sunshine-duration.service';
import { SunshineDurationController } from '@/sunshine-duration/sunshine-duration.controller';

@Module({
  exports: [SunshineDurationService],
  providers: [SunshineDurationService],
  controllers: [SunshineDurationController],
  imports: [ConfigModule, ActivityLogModule],
})
export class SunshineDurationModule {}
