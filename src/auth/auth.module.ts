import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthService } from '@/auth/auth.service';
import { AuthController } from '@/auth/auth.controller';
import { HelpersModule } from '@/helpers/helpers.module';
import { LoginLogModule } from '@/login-log/login-log.module';
import { ActivityLogModule } from '@/activity-log/activity-log.module';

@Module({
  providers: [AuthService],
  controllers: [AuthController],
  imports: [ConfigModule, ActivityLogModule, LoginLogModule, HelpersModule],
})
export class AuthModule {}
