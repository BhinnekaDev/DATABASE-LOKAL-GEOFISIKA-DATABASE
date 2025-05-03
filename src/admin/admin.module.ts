import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AdminService } from '@/admin/admin.service';
import { AdminController } from '@/admin/admin.controller';
import { ActivityLogModule } from '@/activity-log/activity-log.module';

@Module({
  imports: [ConfigModule, ActivityLogModule],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
