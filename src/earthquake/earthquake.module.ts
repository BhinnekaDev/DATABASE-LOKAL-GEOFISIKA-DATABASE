import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { EarthquakeService } from '@/earthquake/earthquake.service';
import { ActivityLogModule } from '@/activity-log/activity-log.module';
import { EarthquakeController } from '@/earthquake/earthquake.controller';

@Module({
  exports: [EarthquakeService],
  providers: [EarthquakeService],
  controllers: [EarthquakeController],
  imports: [ConfigModule, ActivityLogModule],
})
export class EarthquakeModule {}
