import { Module } from '@nestjs/common';

import { TimeHelperService } from '@/helpers/time-helper.service';

@Module({
  exports: [TimeHelperService],
  providers: [TimeHelperService],
})
export class HelpersModule {}
