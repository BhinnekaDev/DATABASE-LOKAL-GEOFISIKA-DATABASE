import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoginLogService } from '@/login-log/login-log.service';
import { LoginLogController } from '@/login-log/login-log.controller';

@Module({
  imports: [ConfigModule],
  exports: [LoginLogService],
  providers: [LoginLogService],
  controllers: [LoginLogController],
})
export class LoginLogModule {}
