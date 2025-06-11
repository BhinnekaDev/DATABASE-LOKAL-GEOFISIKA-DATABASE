import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { EvaporationService } from '@/evaporation/evaporation.service';
import { ActivityLogModule } from '@/activity-log/activity-log.module'; 
import { EvaporationController } from '@/evaporation/evaporation.controller';

@Module({
  exports: [EvaporationService],
  providers: [EvaporationService],
  controllers: [EvaporationController],
  imports: [ConfigModule, ActivityLogModule],
})
export class EvaporationModule {}
