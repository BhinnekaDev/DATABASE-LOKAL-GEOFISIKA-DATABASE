import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { LightningService } from '@/lightning/lightning.service';
import { ActivityLogModule } from '@/activity-log/activity-log.module';
import { LightningController } from '@/lightning/lightning.controller';

@Module({
  exports: [LightningService],
  providers: [LightningService],
  controllers: [LightningController],
  imports: [ConfigModule, ActivityLogModule],
})
export class LightningModule {}
