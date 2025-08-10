import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ActivityLogModule } from '@/activity-log/activity-log.module';
import { AverageTemperatureService } from '@/average-temperature/average-temperature.service';
import { AverageTemperatureController } from '@/average-temperature/average-temperature.controller';

@Module({
  exports: [AverageTemperatureService],
  providers: [AverageTemperatureService],
  imports: [ConfigModule, ActivityLogModule],
  controllers: [AverageTemperatureController],
})
export class AverageTemperatureModule {}
