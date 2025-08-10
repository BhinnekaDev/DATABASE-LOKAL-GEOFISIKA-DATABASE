import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ActivityLogModule } from '@/activity-log/activity-log.module';
import { MaxTemperatureService } from '@/max-temperature/max-temperature.service';
import { MaxTemperatureController } from '@/max-temperature/max-temperature.controller';

@Module({
  exports: [MaxTemperatureService],
  providers: [MaxTemperatureService],
  controllers: [MaxTemperatureController],
  imports: [ConfigModule, ActivityLogModule],
})
export class MaxTemperatureModule {}
