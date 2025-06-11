import { Module } from '@nestjs/common';

import { TimeHelperService } from '@/helpers/time-helper.service';
import { RoleHelperService } from '@/helpers/role-helper.service';

@Module({
  exports: [TimeHelperService, RoleHelperService],
  providers: [TimeHelperService, RoleHelperService],
})
export class HelpersModule {}
