import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ActivityLogModule } from '@/activity-log/activity-log.module';
import { RainIntensityService } from '@/rain-intensity/rain-intensity.service';
import { RainIntensityController } from '@/rain-intensity/rain-intensity.controller';

@Module({
  exports: [RainIntensityService],
  providers: [RainIntensityService],
  controllers: [RainIntensityController],
  imports: [ConfigModule, ActivityLogModule],
})
export class RainIntensityModule {}
