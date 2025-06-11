import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ActivityLogModule } from '@/activity-log/activity-log.module';
import { WindDirectionAndSpeedService } from '@/wind-direction-and-speed/wind-direction-and-speed.service';
import { WindDirectionAndSpeedController } from '@/wind-direction-and-speed/wind-direction-and-speed.controller';

@Module({
  exports: [WindDirectionAndSpeedService],
  providers: [WindDirectionAndSpeedService],
  imports: [ConfigModule, ActivityLogModule],
  controllers: [WindDirectionAndSpeedController],
})
export class WindDirectionAndSpeedModule {}
