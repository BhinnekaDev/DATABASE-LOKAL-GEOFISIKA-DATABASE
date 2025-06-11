import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ActivityLogModule } from '@/activity-log/activity-log.module';
import { MicrothermorService } from '@/microthermor/microthermor.service';
import { MicrothermorController } from '@/microthermor/microthermor.controller';

@Module({
  exports: [MicrothermorService],
  providers: [MicrothermorService],
  controllers: [MicrothermorController],
  imports: [ActivityLogModule, ConfigModule],
})
export class MicrothermorModule {}
