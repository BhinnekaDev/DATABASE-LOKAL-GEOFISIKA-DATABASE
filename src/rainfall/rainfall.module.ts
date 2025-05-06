import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { RainfallService } from '@/rainfall/rainfall.service';
import { RainfallController } from '@/rainfall/rainfall.controller';
import { ActivityLogModule } from '@/activity-log/activity-log.module';

@Module({
  exports: [RainfallService],
  providers: [RainfallService],
  controllers: [RainfallController],
  imports: [ConfigModule, ActivityLogModule],
})
export class RainfallModule {}
