import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ActivityLogModule } from '@/activity-log/activity-log.module';
import { MaxTemperaturService } from '@/max-temperatur/max-temperatur.service';
import { MaxTemperaturController } from '@/max-temperatur/max-temperatur.controller';

@Module({
  exports: [MaxTemperaturService],
  providers: [MaxTemperaturService],
  controllers: [MaxTemperaturController],
  imports: [ConfigModule, ActivityLogModule],
})
export class MaxTemperaturModule {}
