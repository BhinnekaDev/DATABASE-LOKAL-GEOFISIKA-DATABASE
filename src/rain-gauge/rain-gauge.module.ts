import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { RainGaugeService } from '@/rain-gauge/rain-gauge.service';
import { ActivityLogModule } from '@/activity-log/activity-log.module';
import { RainGaugeController } from '@/rain-gauge/rain-gauge.controller';

@Module({
  exports: [RainGaugeService],
  providers: [RainGaugeService],
  controllers: [RainGaugeController],
  imports: [ConfigModule, ActivityLogModule],
})
export class RainGaugeModule {}
