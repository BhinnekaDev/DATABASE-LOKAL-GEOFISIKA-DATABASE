import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ActivityLogModule } from '@/activity-log/activity-log.module';
import { AirPressureService } from '@/air-pressure/air-pressure.service';
import { AirPressureController } from '@/air-pressure/air-pressure.controller';

@Module({
  exports: [AirPressureService],
  providers: [AirPressureService],
  controllers: [AirPressureController],
  imports: [ConfigModule, ActivityLogModule],
})
export class AirPressureModule {}
