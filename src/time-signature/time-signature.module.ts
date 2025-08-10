import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ActivityLogModule } from '@/activity-log/activity-log.module';
import { TimeSignatureService } from '@/time-signature/time-signature.service';
import { TimeSignatureController } from '@/time-signature/time-signature.controller';

@Module({
  exports: [TimeSignatureService],
  providers: [TimeSignatureService],
  controllers: [TimeSignatureController],
  imports: [ConfigModule, ActivityLogModule],
})
export class TimeSignatureModule {}
