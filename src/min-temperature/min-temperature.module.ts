import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ActivityLogModule } from '@/activity-log/activity-log.module';
import { MinTemperatureService } from '@/min-temperature/min-temperature.service';
import { MinTemperatureController } from '@/min-temperature/min-temperature.controller';

@Module({
  exports: [MinTemperatureService],
  providers: [MinTemperatureService],
  controllers: [MinTemperatureController],
  imports: [ActivityLogModule, ConfigModule],
})
export class MinTemperatureModule {}
