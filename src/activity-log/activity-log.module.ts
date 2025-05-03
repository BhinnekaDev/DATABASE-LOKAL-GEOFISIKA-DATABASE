import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ActivityLogService } from '@/activity-log/activity-log.service';
import { ActivityLogController } from '@/activity-log/activity-log.controller';

@Module({
  imports: [ConfigModule],
  exports: [ActivityLogService],
  providers: [ActivityLogService],
  controllers: [ActivityLogController],
})
export class ActivityLogModule {}
