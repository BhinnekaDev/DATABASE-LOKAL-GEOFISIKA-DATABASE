import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AdminService } from '@/admin/admin.service';
import { HelpersModule } from '@/helpers/helpers.module';
import { AdminController } from '@/admin/admin.controller';
import { ActivityLogModule } from '@/activity-log/activity-log.module';

@Module({
  exports: [AdminService],
  providers: [AdminService],
  controllers: [AdminController],
  imports: [ConfigModule, ActivityLogModule, HelpersModule],
})
export class AdminModule {}
