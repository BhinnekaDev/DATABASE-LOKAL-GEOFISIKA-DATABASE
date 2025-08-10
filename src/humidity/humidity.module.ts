import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { HumidityService } from '@/humidity/humidity.service';
import { HumidityController } from '@/humidity/humidity.controller';
import { ActivityLogModule } from '@/activity-log/activity-log.module';

@Module({
  exports: [HumidityService],
  providers: [HumidityService],
  controllers: [HumidityController],
  imports: [ConfigModule, ActivityLogModule],
})
export class HumidityModule {}
