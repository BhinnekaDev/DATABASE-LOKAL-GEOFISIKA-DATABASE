import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { RainyDaysService } from '@/rainy-days/rainy-days.service';
import { ActivityLogModule } from '@/activity-log/activity-log.module';
import { RainyDaysController } from '@/rainy-days/rainy-days.controller';

@Module({
  exports: [RainyDaysService],
  providers: [RainyDaysService],
  controllers: [RainyDaysController],
  imports: [ConfigModule, ActivityLogModule],
})
export class RainyDaysModule {}
