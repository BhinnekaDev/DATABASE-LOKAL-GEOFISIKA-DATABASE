import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { HelpersModule } from '@/helpers/helpers.module';
import { ActivityLogService } from '@/activity-log/activity-log.service';
import { ActivityLogController } from '@/activity-log/activity-log.controller';

@Module({
  exports: [ActivityLogService],
  providers: [ActivityLogService],
  controllers: [ActivityLogController],
  imports: [ConfigModule, HelpersModule],
})
export class ActivityLogModule {}
